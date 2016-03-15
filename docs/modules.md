## Modules

The SDK implementation was splitted into several modules:

### @splitsoftware/splitio-utils

Common package where you could find some of the shared libraries (extremely
simple libs).

### @splitsoftware/splitio-services

Services layer which isolate how we communicate with the Split backend.

### @splitsoftware/splitio-metrics

Everything about SDK tracking is defined in this module.

### @splitsoftware/splitio-engine

Split runtime which all the evaluation mechanism.

### @splitsoftware/splitio-cache

Data layer used by splitio-engine.

### @splitsoftware/splitio

SDK public API.

### @splitsoftware/splitio-browser

Tools for export the NodeJS SDK into a browser bundle using browserify.
