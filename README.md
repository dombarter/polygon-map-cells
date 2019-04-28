# Polygon Map Cells

Generates a series of polygons and points based off a centre point, arc length and max radius.

# Usage

```
var Cells = require('polygon-map-cells');

var options = {
    maxRadius: 1500,
    arcLength: 500,
    centre: {
        lat: 53.396870,
        long: -1.426108,
    }
}

var cells = Cells(options);
```

Max Radius and Arc Length are measured in metres.
