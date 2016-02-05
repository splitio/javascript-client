# SPLIT Browser

This module provides support for the browser as a dropin javascript file to be
included in your HTML using a `<script>`.

> As well could be used by environments running `browserify`.

## API

### .isOn(featureName : string) : boolean

Given a feature name, ask the engine if the current user is able or not to
access the provided feature.
