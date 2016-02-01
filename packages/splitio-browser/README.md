# SPLIT Browser

This module provides support for the browser as a dropin javascript file to be
included in your HTML using a `<script>`.

## API

### splitio.isOn('feature') : boolean

Given a feature name, ask the engine if the current user is able or not to
access the feature.

### [COMING SOON] splitio.getTreatmentFor('feature') : string

Given a feature name, ask the engine to evaluate the treatment which match with
the current user.
