/*!
    timely-dependency-graph 1.0.0
    (c) 2016 Luca Bonavita http://mindrones.com
    Source code at https://github.com/mindrones/timely-dependency-graph
    timely-dependency-graph may be freely distributed under the GPL-V3 license.
*/

var d3 = require('d3')
var _ = require('underscore')
var semver = require('semver')
var parseVersion = require('./utils/semver').parseVersion
var domUtils = require('./utils/dom')

// @if PRODUCTION=true
var REALTIME_DATA = true
// @endif
// @if PRODUCTION=false
var REALTIME_DATA = false
// @endif
var MODULE_NAME = 'd3'
var URL_BASE = REALTIME_DATA ? 'https://registry.npmjs.cf/' : './data/'
var URL_EXTENSION = REALTIME_DATA ? '' : '.json'

var LOG = {
    modules: 0,
    data: 0,
    debugModuleDates: 0,
    cursorMove: 0,
    cursorDate: 0,
    cursorModules: 0,
    logDepTree: 0
}

// dates
var now = new Date()
var minDate = now
var begin = new Date(2015, 10, 1)
var cursorDate;

// fetching logic vars
var progress = {}

// data vars
var modules = {}
var data, moduleNames

// geometry, scaling, axis, behaviors, generators
var geom, xScale, yScale, xAxis, yAxis, zoom
var serversSetLine = d3.svg.line()
    .interpolate('cardinal').tension(0.9)
    // .interpolate('linear')

// y globals
var moduleHeight, moduleSemiHeight, moduleMaxFontSize, releaseCircleRadius

// DOM
var chart, svg, g_modules, g_modules_clipPath, zoomSensor, g_xAxis, g_yAxis, yLabel,
g_module, g_release, g_release_rect, g_release_circle, g_release_text,
g_modules_cursor, serverSet, serverLine, clientLine

// interactivity vars
var useLastValidVersion = false
var showServersAsSets = true
var showClientLines = true
var safetyFontSize = 1
var minFontSize = 3
var userFocus = {
    isFree: true,
    release: undefined
}
var cursorModules, depTree

/* events */

var dispatch =
    d3.dispatch(
        'register_module',
        'mark_module',
        'check_progress',
        'fetch_module',
        'module_fetched',
        'modules_fetched',
        'modules_processed',
        'data_init',
        'data_sorted',
        'resize',
        'cursor_move',
        'cursor_date',
        'cursor_modules',
        'target_change',
        'change_pin',
        'pin_changed',
        'focused_release',
        'dep_tree',
        'which_version'
    )
    .on('register_module', registerModule)
    .on('mark_module', markModule)
    .on('check_progress', checkProgress)
    .on('fetch_module', fetchModule)
    .on('module_fetched.debug', LOG.debugModuleDates ? debugModuleDates : null)
    .on('module_fetched.process', processModule)
    .on('modules_fetched.process', processModules)
    .on('modules_processed.log', LOG.modules ? logModules : null)
    .on('modules_processed', initData)
    .on('data_init', sortModules)
    .on('data_sorted.log', LOG.data ? logData : null)
    .on('data_sorted.init', init)
    .on('resize', resize)
    .on('cursor_move.cursor', updateCursor)
    .on('cursor_move.cursorDate', updateCursorDate)
    .on('cursor_move.log', LOG.cursorMove ? logMousePos : null)
    .on('cursor_date.cursorModules', updateCursorModules)
    .on('cursor_date.sidebar', sidebarFocusUpdateDate)
    .on('cursor_date.log', LOG.cursorDate ? logCursorDate : null)
    .on('cursor_modules.show', showCursorModules)
    .on('cursor_modules.log', LOG.cursorModules ? logCursorModules : null)
    .on('target_change', updateUserFocus)
    .on('change_pin', updatePin)
    .on('pin_changed.sidebar', sidebarFocusUpdatePin)
    .on('focused_release.tree', buildDepTree)
    .on('focused_release.sidebar', sidebarFocusUpdateRelease)
    .on('dep_tree.draw', drawDepTree)
    .on('dep_tree.dim', dimReleasesNotInDepTree)
    .on('dep_tree.yLabels', highlightYLabels)
    .on('dep_tree.log', LOG.logDepTree ? logDepTree : null)
    .on('which_version.controls', updateControls)
    .on('which_version.tree', buildDepTree)

dispatch.fetch_module(MODULE_NAME)

/* fetch data */

function registerModule(name) {
    progress[name] = true
}

function markModule(name) {
    progress[name] = false
    dispatch.check_progress()
}

function checkProgress() {
    var allFetched = _.chain(progress).values().filter().isEmpty().value() === true
    if (allFetched) {
        dispatch.modules_fetched()
    }
}

function fetchModule(name) {
    dispatch.register_module(name)

    var url = URL_BASE + name + URL_EXTENSION
    d3.json(url, function(err, json) {
        if (err) {
            throw err
        }
        dispatch.module_fetched(json)
    })
}

/* process data */

// processedModule {
//     _npm: {},
//     name: 'name',
//     releases: {
//         version: release {
//             name: 'name',
//             version: versionString,
//             [dependencies]: {
//                 name: dependenciesObject,
//                 ...
//             },
//             startDate: date,
//             endDate: date,
//             nextVersion: versionString,
//             displayVersion: versionString,
//         },
//         ...
//     }
//     dates: {
//         version: date,
//         ...
//     }
// }
// renames:
// .versions -> .releases
// .time -> .dates
function processModule(moduleObj) {
    var name = moduleObj.name

    var processedModule = {
        _npm: moduleObj,
        name: name
    }

    // DEBUG filter out dependencies without a release?

    process_dates()
    process_releases()

    // store module in modules
    modules[name] = processedModule;

    // start fetching missing deps
    _.chain(processedModule.releases)
        .map(function(release, version) {
            return _.keys(release.dependencies)
        })
        .flatten()
        .uniq()
        .each(function(depName) {
            if (!_.has(progress, depName)) {
                dispatch.fetch_module(depName)
            }
        })
    dispatch.mark_module(name)

    function process_dates() {
        processedModule.dates =
            _.chain(moduleObj.time)
            .omit(function(dateString, version) {
                return (version === 'created') || (version === 'modified') ||   // versionIsWord
                    ((name === 'd3') ? (version[0] < '4') : false) ||           // isD3VersionLt4
                    !_.has(moduleObj.versions, version)                         // versionHasNoRelease
                    // moduleObj.time can have {version, dateString}
                    // without a corresponding {version, release} in moduleObj.versions
                    // -> not|un-published modules?
            })

            // sort object keys (by version): to be used in threshold scales
            .pairs()
            .sort(function(pairA, pairB) {
                // pair = [version, dateString]
                return semver.compare(pairA[0], pairB[0])
            })
            .object()

            .mapObject(function(dateString, version) {
                var date = new Date(dateString)

                // update the global minimum date
                if (date < minDate) { minDate = date }

                return date
            })
            .value()

        processedModule.versionByDateScale = d3.scale.threshold()
            .domain(_.values(processedModule.dates))
            .range([undefined].concat(_.keys(processedModule.dates)))
    }

    function process_releases() {
        processedModule.releases =
            _.chain(moduleObj.versions)
            .omit(function(release, version) {
                return (name === 'd3') ? (version[0] < '4') : false
            })

            // sort object keys (by version): to use findKey() below
            .pairs()
            .sort(function(pairA, pairB) {
                // pair = [version, release]
                return semver.compare(pairA[0], pairB[0])
            })
            .object()

            .mapObject(function(release, version, releasesObj) {
                var rel = _.pick(release, 'name', 'version')
                rel.id = rel.name + '_' + rel.version
                rel.nextVersion = _.findKey(releasesObj, function(cursor_release, cursor_version) {
                    return semver.gt(cursor_version, version)
                })
                rel.startDate = processedModule.dates[version]
                rel.endDate = rel.nextVersion ? processedModule.dates[rel.nextVersion] : now
                rel.displayVersion = version.replace('alpha', 'α').replace('beta', 'β')
                if (release.dependencies) {
                    rel.dependencies = _.mapObject(release.dependencies, parseVersion)
                }
                return rel
            })
            .value()
    }
}

function processModules() {
    processDependencies()
    dispatch.modules_processed()

    function processDependencies() {
        _.each(modules, function(moduleObj, name) {
            _.each(moduleObj.releases, function(release, version) {
                if (release.dependencies) {
                    release.dependencies = _.mapObject(release.dependencies, function(dep, depName) {

                        // add dep.last
                        var depVersion
                        if (dep.isRelease) {
                            depVersion = dep.version
                        } else if (dep.isRange) {
                            depVersion = dep.first

                            // '~1.2.3' := '>=1.2.3 <1.3.0'
                            // 1.2.3,   1.2.4,  1.2.5,  1.3.0
                            // ^ first          ^ last  ^ stop
                            // => dep {isRange: true, first: '1.2.3', last: '1.2.5', stop: '1.3.0'}
                            dep.last =
                                _.chain(modules[depName].releases)
                                .keys()
                                .filter(function(_version) {
                                    return semver.lt(_version, dep.stop)
                                })
                                .last()
                                .value()
                        }

                        // add client
                        var depRelease = modules[depName].releases[depVersion]
                        if (!_.has(depRelease, 'clients')) {
                            depRelease.clients = []
                        }
                        depRelease.clients.push(release)

                        return dep
                    })
                }
            })
        })
    }
}

function logModules() {
    console.log('modules', modules)
}

function initData() {
    data = _.values(modules)
    moduleNames = _.map(data, function(d) { return d.name })
    dispatch.data_init()
}

function sortModules() {
    // data = _.sortBy(data, function(module) {return -_.size(module.releases)})
    data.sort(function(moduleA, moduleB) {
        return _.size(moduleB.releases) - _.size(moduleA.releases)
    })
    // moduleNames = _.map(data, function(d) { return d.name })
    // FIXME no need to sort modulenames, we need to sort positions

    dispatch.data_sorted()
}

function logData() {
    console.log('data', data)
}

/* render chart */

function init() {
    setupChart()
    updateGeometry()
    initScales()
    updateScalesGeometry()
    updateXYGlobals()
    initZoom()
    updateZoomGeometry()
    initAxes()
    updateAxesGeometry()
    drawChart()
    setChartGeometry()
    hideMicroReleaseText()
    enableChartInteractivity()
    setOnResize()
    initControls()
}

function extendRectGeometry(obj) {
    // obj {width, height, x, y, top, right, bottom, left}
    return _.extend(obj, {
        size: [obj.width, obj.height],
        corner: {
            tl: [obj.x, obj.y],
            tr: [obj.x + obj.width, obj.y],
            bl: [obj.x, obj.y + obj.height],
            br: [obj.x + obj.width, obj.y + obj.height]
        }
    })
}

function updateGeometry() {
    geom = {
        chart: domUtils.getElementGeometry(chart.node()),
        modules: {
            pad: {
                top: 0.05,
                right: 0.12,
                bottom: 0.05,
                left: 0.05,
            }
        }
    }
    geom.modules.top = geom.chart.height * geom.modules.pad.top
    geom.modules.right = geom.chart.width * geom.modules.pad.right
    geom.modules.bottom = geom.chart.height * geom.modules.pad.bottom
    geom.modules.left = geom.chart.width * geom.modules.pad.left
    geom.modules.x = geom.modules.left
    geom.modules.y = geom.modules.top
    geom.modules.width = geom.chart.width - geom.modules.left - geom.modules.right
    geom.modules.height = geom.chart.height - geom.modules.top - geom.modules.bottom
    extendRectGeometry(geom.modules)
}

function initScales() {
    xScale = d3.time.scale()
        .domain([begin, now])
        // .clamp(true)
        // ISSUE
        // detect if zoom scale is clamped -> don't change the scale if we're off the limit
        // see checkXscaleDomain() below
    yScale = d3.scale.ordinal()
        .domain(moduleNames)
}

function updateScalesGeometry() {
    xScale.range([0, geom.modules.width])
    yScale.rangeBands([0, geom.modules.height])
}

// optimization: use global vars dependant only on geometry for reuse
function updateXYGlobals() {
    // y
    moduleHeight = yScale.rangeBand()
    moduleSemiHeight = moduleHeight / 2
    releaseCircleRadius = moduleHeight / 8
    moduleMaxFontSize = 0.4 * moduleHeight
}

function initZoom() {
    zoom =
        d3.behavior.zoom()
        .on('zoom', function() {
            disableFocusEvents()
            applyZoom()
        })
        .on('zoomend', function() {
            enableFocusEvents();
        })
}

function updateZoomGeometry() {
    zoom
        .size(geom.modules.size)
        .x(xScale)

    // ISSUE
    // zoom.x(xScale) works only if xScale has both domain & range set up
}

function initAxes() {
    xAxis = d3.svg.axis()
        .scale(xScale)
        .orient('top')

    yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('right')
}

function updateAxesGeometry() {
    xAxis
        .tickSize(-geom.modules.height, 0)
        .tickPadding(geom.modules.y / 20)

    yAxis
        .tickSize(-geom.modules.width, 0)
        .tickPadding(geom.modules.x / 20)
}

function setupChart() {
    chart = d3.select('#chart')
    svg = chart.append('svg')

    g_xAxis = svg.append('g').attr('class', 'x axis')
    g_yAxis = svg.append('g').attr('class', 'y axis')

    g_modules = svg.append('g')
        .attr('id', 'modules')
        .attr('clip-path', 'url(#clip)')

    g_modules_clipPath =
        g_modules.append('clipPath')
            .attr('id', 'clip')
            .append('rect')

    g_modules_sensor =
        g_modules.append('rect')
            .classed('sensor', true)

    g_modules_cursor =
        g_modules.append('line')
            .classed('cursor', true)

    g_depTree =
        g_modules.append('g')
            .attr('id', 'depTree')
}

function drawChart() {

    /* axes */

    g_xAxis.call(xAxis)
    g_yAxis.call(yAxis)

    /* module */

    g_module =
        g_modules.selectAll('.module')
        .data(data, function(d) {return d.name})

        g_module.exit().remove()

        g_module.enter()
        .append('g')
        .classed('module', true)

    /* release */

    g_release =
        g_module.selectAll('.release')
        .data(function(d) { return _.values(d.releases) })

        g_release.exit().remove()

        g_release.enter()
        .append('g')
        .classed('release', true)

    g_release_rect =
        g_release.append('rect')
        .style('fill', function(d, i) { return moduleColor(d.name) })

    g_release_circle =
        g_release.append('circle')
        .style('fill', function(d, i) { return moduleColor(d.name) })
        .style('stroke', function(d, i) { return moduleColor(d.name) })
        .classed('hasDeps', function(d, i) { return d.dependencies ? true : false })

    g_release_text =
        g_release.append('text')
        .style('dominant-baseline', 'middle')
        .style('text-anchor', 'middle')
        .text(function(d, i) { return d.displayVersion })
}

// operators

function operatorReleaseTextDx(d) {
    var xStart = xScale(d.startDate)
    var xMin = Math.max(Math.min(xStart, geom.modules.width), 0)
    var xMax = Math.max(Math.min(xScale(d.endDate), geom.modules.width), 0)
    d.releaseVisibleWidth = Math.max(xMax - xMin, 0)

    return xMin - xStart + d.releaseVisibleWidth / 2
}

function operatorReleaseTextFontSize(d) {
    var bbox = this.getBBox()
    var xRoom = 0.6 * Math.max(d.releaseVisibleWidth - 2 * releaseCircleRadius, 0)
    var scale = Math.min(
        xRoom / bbox.width,
        moduleMaxFontSize / bbox.height
    )
    d.fontSize = Math.max(bbox.height * scale, safetyFontSize);
    return d.fontSize;
}

function setChartGeometry() {

    /* geom */

    svg
        .attr('width', geom.chart.width)
        .attr('height', geom.chart.height)

    /* zoom */

    zoom.size(geom.modules.size)

    /* axes */

    g_xAxis
        .attr('transform', 'translate(' + geom.modules.corner.tl + ')')
        .call(xAxis)

    g_yAxis
        .attr('transform', 'translate(' + geom.modules.corner.tr + ')')
        .call(yAxis)

    /* modules */

    g_modules_clipPath
        .attr('width', geom.modules.width)
        .attr('height', geom.modules.height)

    g_modules
        .attr('transform', 'translate(' + geom.modules.corner.tl + ')')
        .attr('width', geom.modules.width)
        .attr('height', geom.modules.height)

    g_modules_sensor
        .attr('width', geom.modules.width)
        .attr('height', geom.modules.height)

    g_modules_cursor
        .attr('y2', geom.modules.height)

    g_module
        .attr('transform', function(d) {
            return 'translate(0,' + yScale(d.name) + ')'
        })

    g_release
        .attr('transform', function(d, i) {
            d._geometry = {
                x: xScale(d.startDate),
                y: yScale(d.name),
                width: Math.max(xScale(d.endDate) - xScale(d.startDate), 0),
                height: moduleHeight
            }
            d._geometry.center = {
                x: d._geometry.width / 2,
                y: d._geometry.height / 2
            }
            return 'translate(' + d._geometry.x + ',0)'
        })

    g_release_rect
        .attr('width', function(d, i) {
            d._width = Math.max(xScale(d.endDate) - xScale(d.startDate), 0)
            // if (d._width <= 0) {console.log('<= 0:', d)}
            return d._width
        })
        .attr('height', moduleHeight)

    g_release_circle
        .attr('cx', 0)
        .attr('cy', function(d) { return d._geometry.center.y })
        .attr('r', releaseCircleRadius )
        .style('stroke-width', function(d) { return d._geometry.height / 15 })

    g_release_text
        .attr('dx', operatorReleaseTextDx)
        .attr('dy', moduleSemiHeight)
        .style('font-size', operatorReleaseTextFontSize)
}

function hideMicroReleaseText() {
    g_release_text.style('opacity', function(d) {
        d.opacity = d.fontSize < minFontSize ? 1e-6 : null
        return d.opacity
    })
}

function enableChartInteractivity() {
    g_modules
        .on('mousemove', function() {
            var mouse = d3.mouse(this)
            dispatch.cursor_move({x: mouse[0], y: mouse[1]})
        })
        .call(zoom)
        .on('dblclick.zoom', null)
        .on('mouseenter', showCursor)
        .on('mouseleave', function() {
            hideCursor()
            dispatch.cursor_date()
            dispatch.target_change()
        })

    enableFocusEvents()
}

function enableFocusEvents() {
    g_modules_sensor
        .on('mouseover', function() { dispatch.target_change() })

    g_release_rect
        .on('mouseover', function(d) {
            dispatch.target_change(d)
            d3.select(this).classed('focused', userFocus.isFree)
        })
        .on('mouseout', function(d) {
            if (userFocus.isFree) {
                d3.select(this).classed('focused', false)
            }
        })
        .on('mouseup', function(d) {
            dispatch.change_pin(d);
            d3.selectAll('.release rect.pinned').classed('pinned', false);
            d3.select(this).classed({
                pinned: !userFocus.isFree,
                focused: userFocus.isFree
            })
        })
}

function disableFocusEvents() {
    g_modules_sensor
        .on('mouseover', null)
        .on('mouseleave', null)
    g_release_rect
        .on('mouseover', null)
        .on('mouseout', null)
        .on('mouseup', null)
}

/* resize */

function resize() {
    updateGeometry()
    updateScalesGeometry()
    updateXYGlobals()
    updateAxesGeometry()
    updateZoomGeometry()
    setChartGeometry()
    hideMicroReleaseText()
    drawDepTree()
}

function setOnResize() {
    window.onresize = function() {
        dispatch.resize()
    }
}

/* zoom */

function applyZoom() {
    // checkXscaleDomain()
    zoomChart()
    hideMicroReleaseText()
    drawDepTree()
}

// function checkXscaleDomain() {
//     xScale_domain = xScale.domain()
//     // console.log('xScale_domain[1] > now', xScale_domain[1] > now, xScale_domain[1], now)
//     if (xScale_domain[1] > now) {
//         xScale.domain([xScale_domain[0], now])
//     }
//     // jumpy
//     // if (xScale_domain[1] >= now) {
//     //     zoom.scale(1)
//     // }
//     // console.log('zoom.scale()', zoom.scale(), 'xScale.domain()', xScale.domain())
// }

function zoomChart() {

    /* axes */

    g_xAxis.call(xAxis)
    g_yAxis.call(yAxis)

    /* releases */

    g_release
        .attr('transform', function(d, i) {
            return 'translate(' + xScale(d.startDate) + ',0)'
        })

    g_release_rect
        .attr('width', function(d, i) {
            d.width = Math.max(xScale(d.endDate) - xScale(d.startDate), 0)
            // if (d.width <= 0) {console.log('<= 0:', d)}
            return d.width
        })

    g_release_text
        .attr('dx', operatorReleaseTextDx)
        .style('font-size', operatorReleaseTextFontSize)
}

/* cursor */

function hideCursor() {
    g_modules_cursor.classed('hidden', true)
}

function showCursor() {
    g_modules_cursor.classed('hidden', false)
}

function updateCursor(mousePos) {
    g_modules_cursor
        .attr('x1', mousePos.x)
        .attr('x2', mousePos.x)
}

function updateCursorDate(mousePos) {
    cursorDate = xScale.invert(mousePos.x)
    dispatch.cursor_date(cursorDate)
}

function logMousePos(mousePos) {
    console.log(mousePos)
}

function logCursorDate(cursorDate) {
    console.log(cursorDate)
}

/* current modules */

function updateCursorModules(cursorDate) {
    cursorModules = _.mapObject(modules, function(module, name) {
        return module.versionByDateScale(cursorDate)
    })
    dispatch.cursor_modules()
}

function logCursorModules() {
    console.log(cursorModules)
    // {'d3': '4.0.0-alpha.3', 'd3-array': '0.7.0', 'd3-arrays': '0.4.1', 'd3-axis': undefined, ...}
}

function showCursorModules() {
    g_release_rect
    .classed('current', function(d) {
        return cursorModules[d.name] === d.version
    })
}

/* dep tree */

function initDepTree() {
    depTree = {
        // dependencies
        serversSets: {
            _maxDepth: 0
        },
        serverLines: [],

        // dependants
        clientsLines: [],

        nodes: {}
    }
}

function getDepTree() {
    if (_.isUndefined(depTree)) { initDepTree() }
    return depTree
}

function buildDepTree() {
    initDepTree()

    if (!_.isUndefined(userFocus.release)) {
        addReleaseToNodes(userFocus.release)
        addClientsLines()
        addServersSet(userFocus.release, 0)
    }
    dispatch.dep_tree()

    function addReleaseToNodes(release) {
        if (!_.has(depTree.nodes, release.name)) {
            depTree.nodes[release.name] = []
        }
        depTree.nodes[release.name].push(release.version)
    }

    function addClientsLines() {
        depTree.clientsLines = _.map(userFocus.release.clients, function(client) {

            addReleaseToNodes(client)

            // client line
            return {
                id: client.name + '-' + client.version,
                name: client.name,
                coords: {p1: userFocus.release, p2: client}
            }
        })
    }

    function addServersSet(release, depth) {
        if (release.dependencies) {
            var depCoords = _.map(release.dependencies, function(dep, depName) {
                var depVersion
                if (dep.isRelease) { depVersion = dep.version }
                else if (dep.isRange) {
                    depVersion = useLastValidVersion ? dep.last : dep.first
                }

                var server = modules[depName].releases[depVersion]

                addReleaseToNodes(server)

                // add this server line
                depTree.serverLines.push({
                    id: depName + '-' + depVersion,
                    depth: depth,
                    name: depName,
                    coords: {p1: release, p2: server}
                })

                return {
                    name: depName,
                    date: server.startDate
                }
            })

            /* build this level of depth */

            // set

            var coords = [{
                name: release.name,
                date: modules[release.name].releases[release.version].startDate
            }].concat(depCoords)

            depTree.serversSets[release.name] = {
                depth: depth,
                name: release.name,
                version: release.version,
                dependencies: release.dependencies,
                // coords: depCoords
                // don't include the parent module
                // if we have just one dep we don't see links
                coords: coords
                // includes the parent module as a visual reference
                // helps when we have just one dep
            }

            /* build sub-dependencies sets */

            depTree.serversSets._maxDepth = ++depth
            _.each(release.dependencies, function(dep, depName) {
                var depVersion
                if (dep.isRelease) {
                    depVersion = dep.version
                } else if (dep.isRange) {
                    depVersion = useLastValidVersion ? dep.last : dep.first
                }
                var subRelease = modules[depName].releases[depVersion]
                addServersSet(subRelease, depth)
            })
        }
    }
}

function logDepTree() {
    console.log('depTree', depTree)
}

function drawDepTree() {
    var widthOperator = getOperatorDepGraphLineWidth(getDepTree().serversSets._maxDepth)

    drawClientsLines()
    drawServers()

    function drawClientsLines() {
        if (showClientLines) {
            clientLine =
                g_depTree.selectAll('.clientLine')
                    .data(depTree.clientsLines, function(d) { return d.id })

            clientLine.exit().remove()
            clientLine.enter()
                .append('line')
                .classed('clientLine', true)
                .style('stroke', function(d) { return moduleColor(d.name) })
                .style('stroke-dasharray', moduleHeight / 10)
            clientLine
                .attr('x1', function(d) { return xScale(d.coords.p1.startDate) })
                .attr('y1', function(d) { return yScale(d.coords.p1.name) + moduleSemiHeight })
                .attr('x2', function(d) { return xScale(d.coords.p2.startDate) })
                .attr('y2', function(d) { return yScale(d.coords.p2.name) + moduleSemiHeight })
        } else {
            clientLine.remove()
        }
    }

    function drawServers() {
        if (showServersAsSets) { drawServersSets() }
        else { drawServersLines() }
    }

    function drawServersLines() {
        if (serverSet) { serverSet.remove() }

        serverLine =
            g_depTree.selectAll('.serverLine')
                .data(depTree.serverLines, function(d) { return d.id })

        serverLine.exit().remove()
        serverLine.enter()
            .append('line')
            .classed('serverLine', true)
            .style('stroke', function(d) { return moduleColor(d.name) })
            .style('stroke-width', widthOperator)
        serverLine
            .attr('x1', function(d) { return xScale(d.coords.p1.startDate) })
            .attr('y1', function(d) { return yScale(d.coords.p1.name) + moduleSemiHeight })
            .attr('x2', function(d) { return xScale(d.coords.p2.startDate) })
            .attr('y2', function(d) { return yScale(d.coords.p2.name) + moduleSemiHeight })
    }

    function drawServersSets() {
        if (serverLine) { serverLine.remove() }

        var sets = _.chain(depTree.serversSets)
            .omit('_maxDepth')
            .map(function(set, name) {
                return {
                    depth: set.depth,
                    name: name,
                    coords: _.map(set.coords , function(coord, index) {
                            return [xScale(coord.date), yScale(coord.name) + moduleSemiHeight]
                        })
                        .sort(function(coordA, coordB) { return coordA[1] - coordB[1] })
                }
            })
            .value()

        serverSet =
            g_depTree.selectAll('.serverSet')
                .data(sets, function(d) { return d.name })

        serverSet.exit().remove()
        serverSet.enter()
            .append('path')
            .classed('serverSet', true)
            .style('stroke', function(d) { return moduleColor(d.name) })
            .style('stroke-width', widthOperator)
            // .style('stroke-dasharray', function(d) {
            //     return d.depth * moduleHeight / 5
            // })
        serverSet.attr('d', function(d) { return serversSetLine(d.coords) })
    }
}

function getOperatorDepGraphLineWidth(maxDepth) {
    return function(d) {
        // add k pixels to the min thickness
        // y + k = mx^n + q
        // M + k = m * 0 + q -> q = M+k
        // 1 + k = m * M^n + M+k -> m = (1 - M) / M^n
        // y = M + k + d * (1 - M) / M^n
        var k = 0.5
        var n = 0.25
        var M = maxDepth
        return M + k + d.depth * (1 - M) / Math.pow(M, n);

        // nice thickness degradation,
        // but for depth = 1 thickness is too similar to client lines
        // y = mx^n + q
        // M = m * 0 + q -> q = M
        // 1 = m * M^n + M -> m = (1 - M) / M^n
        // y = M + d * (1 - M) / M
        // var n = 0.8
        // var M = depTree.serversSets._maxDepth
        // return M + d.depth * (1 - M) / Math.pow(M, n);
    }
}

function operatorReleaseNotInDepTree(d) {
    var dimmed = !(
        _.has(depTree.nodes, d.name) &&
        _.contains(depTree.nodes[d.name], d.version)
    )
    return dimmed
}

function dimReleasesNotInDepTree() {
    if (_.size(depTree.nodes) === 0) {
        g_release_circle.classed('dimmed', false)
        g_release_text.classed('dimmed', false)
    } else {
        g_release_circle.classed('dimmed', operatorReleaseNotInDepTree)
        g_release_text.classed('dimmed', operatorReleaseNotInDepTree)
    }
}

function highlightYLabels() {
    if (_.isUndefined(yLabel)) { yLabel = g_yAxis.selectAll('.y.axis .tick text') }

    if (_.size(depTree.nodes) === 0) {
        yLabel
            .classed('nodeYLabel', false)
            .classed('focusedReleaseYLabel', false)
            .style('font-size', null)
    } else {
        yLabel
            .each(function(d) {
                var isNodeYLabel = _.has(depTree.nodes, d)
                var isFocusedReleaseYLabel = (d === userFocus.release.name)
                var newFontSize = Math.max(
                    moduleMaxFontSize,
                    domUtils.getTextFontSize(this)
                )
                d3.select(this)
                    .classed('nodeYLabel', isNodeYLabel)
                    .classed('focusedReleaseYLabel', isFocusedReleaseYLabel)
                    .style('font-size', isNodeYLabel ? newFontSize : null)
            })
    }
}

/* focus state */

function updateUserFocus(d) {
    if (userFocus.isFree) {
        userFocus.release = d
        dispatch.focused_release()
    }
}

function updatePin(d) {
    if (userFocus.isFree) {
        userFocus.isFree = false;
    } else {
        userFocus.isFree = (d.id === userFocus.release.id)
        if (!userFocus.isFree) {
            // we clicked on a new rect -> build a new tree
            userFocus.release = d
            dispatch.focused_release()
        }
    }
    dispatch.pin_changed()
}

/* sidebar */

function sidebarFocusUpdateDate() {
    var dateP = d3.select('#sidebar .cursor .date .value')
    var timeP = d3.select('#sidebar .cursor .time .value')
    if (cursorDate) {
        dateP.text(cursorDate.toDateString())
        timeP.text(cursorDate.toTimeString())
    } else {
        dateP.text('-')
        timeP.text('-')
    }
}

function sidebarFocusUpdateRelease() {
    var moduleP = d3.select('#sidebar .release .module .value')
    var versionP = d3.select('#sidebar .release .version .value')
    var dateP = d3.select('#sidebar .release .date .value')
    var timeP = d3.select('#sidebar .release .time .value')
    if (userFocus.release) {
        moduleP.text(userFocus.release.name)
        versionP.text(userFocus.release.version)
        dateP.text(userFocus.release.startDate.toDateString())
        timeP.text(userFocus.release.startDate.toTimeString())
    } else {
        moduleP.text('-')
        versionP.text('-')
        dateP.text('-')
        timeP.text('-')
    }
}

function sidebarFocusUpdatePin() {
    d3.select('#pinIcon').classed('hidden', userFocus.isFree);
}

/* controls */

function initControls() {
    updateControls()
    enableControls()
}

function updateControls() {
    d3.selectAll('#sidebar input[name="version"]')
        .each(function(d) {
            this.checked = (this.value === 'useLast') ? useLastValidVersion : !useLastValidVersion
        })

    // TODO
    // d3.select('#sidebar input[name="showValidityPeriod"]')
    //     .attr('disabled', useLastValidVersion ? 'disabled' : null)

    d3.select('#sidebar input[name="showServersAsSets"]')
        .attr('checked', showServersAsSets ? 'checked' : null)

    d3.select('#sidebar input[name="showClientsLines"]')
        .attr('checked', showClientLines ? 'checked' : null)
}

function enableControls() {
    d3.selectAll('#sidebar input[name="version"]')
        .on('change', function(d) {
            useLastValidVersion = this.value === 'useLast'
            dispatch.which_version()
        })

    d3.select('#sidebar input[name="showServersAsSets"]')
    .on('change', function(d) {
        showServersAsSets = this.checked
        dispatch.dep_tree()
    })

    d3.select('#sidebar input[name="showClientsLines"]')
    .on('change', function(d) {
        showClientLines = this.checked
        dispatch.dep_tree()
    })
}


/* colors */

function moduleColor(name) {
    var hScale =
        d3.scale.ordinal()
        .domain(moduleNames)
        .rangePoints([0, 300])    // red -> magenta
    return d3.hsl(hScale(name), 0.85, 0.5)
}

/* DEBUG */

function debugModuleDates(moduleObj) {
    var name = moduleObj.name

    // debug: are there dates without a correspondant release?
    var datesWithoutRelease =
        _.chain(moduleObj.time)
        .omit('created', 'modified')
        .pick(function(dateString, version) {
            return !_.has(moduleObj.versions, version)
        })
        .value()
    if (!_.isEmpty(datesWithoutRelease)) {
        console.log('- datesWithoutRelease -', name, datesWithoutRelease)
    }
}
