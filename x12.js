const fs = require('fs');
const async = require('async');
const map = require('./x12map.json')

function parse(file, callback) {
    if (file.includes('/')) {
        fs.readFile(file, 'utf8', (err, contents) => {
            textToJSON(contents, callback)
        });
    } else {
        return textToJSON(file, callback);
    }
}

function textToJSON(text, callback) {
    //console.log(text)
    let segTerm = text.substr(text.length - 1), // segment terminator (last character in doc)
        data = text.split(segTerm),
        parsed = {},
        eleSep,
        subEleSep,
        prevSeg,
        loopIndex = 0

    async.forEachSeries(data, (segment, nextSegment) => {
        //console.log(segment)
        let seg, seg_id

        if (!eleSep) {
            // element separator (last char in ISA segment)
            eleSep = segment.substr(segment.length - 2, 1); //console.log(segment, eleSep)
            // subelement separator (second to last char in ISA segment)
            subEleSep = segment.substr(segment.length - 1)
        }
        seg = segment.split(eleSep);
        seg_id = seg[0];

        seg.shift(); // Remove firsts

        if (seg_id in map) {
            let mapNode = map[seg_id],
                segName = mapNode.node,
                parentNode = mapNode.parent,
                mapElements = mapNode.elements,
                skip = false,
                mapIndex = 0

            if(mapNode.type == 'multi' && prevSeg == segName) {
                ++loopIndex
            } else loopIndex = 0
            prevSeg = segName

            for(var i in mapElements) {
                if(skip) {
                    skip = false
                    continue
                }

                let segVal = seg[i],
                    element = mapElements[mapIndex],
                    eleName,
                    eleVal = null

                if(typeof element == 'object' && Array.isArray(element)) {
                    skip = true
                    eleName = Object.keys(element)[0]
                    if(element[eleName] != null) {
                        eleVal = {}
                        let qualType = element[eleName]
                        let qualLabel = mapNode.qualifiers[qualType][segVal]
                        eleVal[qualLabel] = seg[parseInt(i)+1].trim()
                    }
                 /*} else if(typeof element == 'object') {
                    //skip = true
                    eleName = Object.keys(element[0])[0]

                    let qualType = element[0][eleName]
                    eleVal = mapNode.qualifiers[qualType][segVal]

                    console.log(parentNode, eleName, qualType)
                    //eleVal[qualLabel] = seg[parseInt(i)+1].trim()*/
                } else {
                    eleName = element
                    eleVal = segVal.trim()
                    //console.log('val', eleVal)
                }

                let ref

                if(parentNode) {
                    //console.log('pn', parentNode)
                    if (!(parentNode in parsed))
                        parsed[parentNode] = /*['loop'].indexOf(mapNode.type) > -1 ? [] :*/ {}
                    ref = parsed[parentNode]
                    //console.log(ref)
                } else ref = parsed

                //console.log('ref', ref)

                if (!(segName in ref)) {
                    //console.log('insert seg name', segName)
                    ref[segName] = ['multi'].indexOf(mapNode.type) > -1 ? [] : {}
                    //console.log('type', ref[segName])
                }
                ref = ref[segName]

                /*if(!('raw' in ref))
                    ref.raw = segment*/

                //console.log('li', loopIndex)

                if(mapNode.type == 'multi') {
                    if(!ref[loopIndex])
                        ref[loopIndex] = {}
                    if(!('raw' in ref[loopIndex]))
                        ref[loopIndex].raw = segment
                    ref[loopIndex][eleName] = eleVal
                } else {
                    if(!('raw' in ref))
                        ref.raw = segment
                    ref[eleName] = eleVal
                }

                ++mapIndex
            }
        }

        nextSegment()
    }, (err) => {
        callback(err, parsed);
    });
}

module.exports.parse = parse