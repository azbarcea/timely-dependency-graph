# [D3 modules dependency time graphs](https://mindrones.github.io/timely-dependency-graph)

As of today, this script create dependency graphs of [D3 modules](https://github.com/d3), for `d3` version 4+.
In the future it might support generic `npm` modules.

Focusing on a certain release of a d3 module, you can visualize its dependencies tree and the modules that depends on the focused release.


## Usage

### Interaction

- With the mouse, hover the release rectangles to show their dependencies graph
- With the mouse wheel, zoom in and out
- Drag (click + move) to pan left-right

### Sidebar

**FOCUS panel**

Shows:

- the cursor date and time
- the hovered release `name`, `version`, `date` and `time`

**CONTROLS panel**

- choose how you want to inspect dependencies release date.

  For example, `d3-shape` version `0.6.0` depends on `d3-path` version `~0.1.3`. In [semver](https://github.com/npm/node-semver) lingo this is a version `range` meaning `>=0.1.3 <0.2.0`, hence as of now:
  - the first valid version of `d3-path` as a dependency of `d3-shape` `0.6.0` is `0.1.3`
  - the last valid version of `d3-path` as a dependency of `d3-shape` `0.6.0` is `0.1.5`
  
  ![First and last valid dependency version](https://raw.githubusercontent.com/mindrones/timely-dependency-graph/master/doc/images/d3_modules_use_first_or_last.gif)

- choose how to visualize "servers" (dependencies):
  - as "sets" (lines passing through the focused release and all servers)
  - as links between each server and the focused release

- choose if you want to see "client lines", links between the focused release and its clients.

**LEGEND panel**

Shows graphs elements representation associated with their meaning.
Well, it's a legend :)

### UI terminology

- `server`: a module the focused release depends on
- `client`: a module depending on the hovered release

(this will most certainly change in the future)


## To run it locally

Install dependencies:

- [optional] install `node` and `npm` on your system
- `cd <your work directory>`
- `clone git@github.com:mindrones/timely-dependency-graph.git`
- `cd timely-dependency-graph`
- `npm install`

Run:

- `gulp`
- when prompted, navigate to [http://localhost:8001](http://localhost:8001)
