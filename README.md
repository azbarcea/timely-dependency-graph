# [D3 modules dependency time graphs](https://mindrones.github.io/timely-dependency-graph)

As of today, this script create dependency graphs of [D3 modules](https://github.com/d3), for `d3` version 4+.

In the future it might support generic `npm` modules.

## Terminology

- `server`: a module the hovered release depends on
- `client`: a module depending on the hovered release

(this will most certainly change in the future)

## Usage

- With the mouse, hover the release rectangles to show their dependencies graph
- With the mouse wheel, zoom in and out
- Drag (click + move) to pan left-right

## Sidebar

### FOCUS panel

Shows:
- the cursor date and time
- the hovered release `name`, `version`, `date` and `time`

### CONTROLS panel

- choose how you want to inspect dependencies release date.

  For example if a module `X` has a release `0.1.1` that depends on module `Y` version `~1.2.3` and `Y` has also released versions `1.2.4`, `1.2.5`, `1.2.6` and `1.3.0`:
  - the first valid version of `Y` as a dependency of `X-0.1.1` is `1.2.3`
  - the last valid version of `Y` as a dependency of `X-0.1.1` is `1.2.6`
- choose how to visualize "servers" (dependencies):
  - as "sets" (lines passing through all servers, including the focused release)
  - as links between each server and the focused release
- choose if you want to see "client lines", links between each client and the focused release

### LEGEND panel

Shows graphs elements representation associated with their meaning (well, it's a legend :) )


## To use it locally

Install dependencies:

- [optional] install `node` and `npm` on your system
- `cd <your work directory>`
- `clone git@github.com:mindrones/timely-dependency-graph.git`
- `cd timely-dependency-graph`
- `npm install`

Run locally

- `gulp`
- when prompted, navigate to [http://localhost:8001](http://localhost:8001)
