# Polygon Map Cells

Generates a series of polygons and points based off a centre point and max radius.

# Usage

```
var Cells = require('polygon-map-cells');

var options = {
    maxRadius: 15,
    centre: {
        lat: 53.396870,
        long: -1.426108,
    }
}

var cells = Cells(options);
```

Max Radius is measured in km.
