x12 EDI Parser
====

Parses EDI x12 format messages into a JSON object.

Uses an optional map file to control the format of the resulting object. The map root nodes are named after segment identifiers in the EDI doc, and the elements under the node correspond to separated elements in the EDI doc in the order they appear.

```
let x12 = new (require('./x12.js'))
x12.parse('Valid EDI string', (err, parsed) => console.log(parsed))
```
