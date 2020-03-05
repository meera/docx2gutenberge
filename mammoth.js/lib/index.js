var _ = require("underscore");

var docxReader = require("./docx/docx-reader");
var docxStyleMap = require("./docx/style-map");
var DocumentConverter = require("./document-to-html").DocumentConverter;
var readStyle = require("./style-reader").readStyle;
var readOptions = require("./options-reader").readOptions;
var unzip = require("./unzip");
var Result = require("./results").Result;

exports.convertToHtml = convertToHtml;
exports.convertToMarkdown = convertToMarkdown;
exports.convert = convert;
exports.extractRawText = extractRawText;
exports.images = require("./images");
exports.transforms = require("./transforms");
exports.underline = require("./underline");
exports.embedStyleMap = embedStyleMap;
exports.readEmbeddedStyleMap = readEmbeddedStyleMap;



exports.converToGutenberge = converToGutenberge;

function converToGutenberge(input, options) {
     return unzip.openZip(input)
        .then(docxReader.read)
        .then(function(documentResult) {
            return convertElementToBlocks(documentResult.value)
           
        });
}

function enclose(element, startTag, endTag) {

    //console.log('inside enclose');
    var output = startTag;
    output = output + element.children.map(convertElementToBlocks); 
    output = output + endTag;
    return output;
}

var doubleLine = '<!-- wp:block {"ref":921} /-->\n';
var singleLine = '<!-- wp:block {"ref":920} /-->\n';
// <!-- wp:paragraph {"align":"center"} -->
// <p class="has-text-align-center"><em>Relevance in Three Moves</em></p>
// <!-- /wp:paragraph -->'

var newLines = 0; 
function convertElementToBlocks(element) {
    //return 'Foo';
    

    switch ( element.type) {
        case "paragraph": {

            output =  element.children.map(convertElementToBlocks).join('');
            //console.log('Output  ', output.trim(), ' Trim length ', output.trim().length);
            if ( output.trim().length === 0 ){

                newLines++;
                return '';
            }

           /* if( element.alignment === "center") { 
                output = '<!-- wp:paragraph {"align":"center"} -->\n' +
                '<p class="has-text-align-center">' + output + '</p>\n' +
                '<!-- /wp:paragraph -->\n';
                
            } else {

                if ( output.startsWith("...") || (output.startsWith("*"))) {
                    output  = '<!-- wp:paragraph {"className": "hang" } -->\n' +
                        '<p class="hang">' + output + '</p>\n' +
                      '<!-- /wp:paragraph -->\n';
                      return output;
                } else {

                }


            }
            */

            output = "<!-- wp:paragraph -->" + "\n" + 
            '<p>' + output  + '</p>' + '\n' +
            "<!-- /wp:paragraph -->\n" +
            "\n";



            
            if (newLines > 2) {
                newLines = 0;
                return doubleLine + '\n' + output; 
            } 

            if( newLines === 2) {
                newLines = 0;
                return  singleLine + '\n' + output;
            } 
            
            return output;
        }
        case "run": {
            var run = element;
            // if (run.isSmallCaps) {
            //     paths.push(findHtmlPathForRunProperty("smallCaps"));
            // }
            // if (run.isStrikethrough) {
            //     paths.push(findHtmlPathForRunProperty("strikethrough", "s"));
            // }
            // if (run.isUnderline) {
            //     paths.push(findHtmlPathForRunProperty("underline"));
            // }
            // if (run.verticalAlignment === documents.verticalAlignment.subscript) {
            //     paths.push(htmlPaths.element("sub", {}, {fresh: false}));
            // }
            // if (run.verticalAlignment === documents.verticalAlignment.superscript) {
            //     paths.push(htmlPaths.element("sup", {}, {fresh: false}));
            // }
            if (run.isItalic) {
                //console.log( 'Run I', run);
                output = element.children.map(convertElementToBlocks).join('');
                if ( output.trim().length === 0 )
                    return "";
                else 
                    return '<em>' + output +  '</em>';
                
            }
            if (run.isBold) {
                output = element.children.map(convertElementToBlocks).join('');
                if ( output.trim().length === 0 )
                    return "";
                else 
                    return '<strong>' + output +  '</strong>';


            }
            return element.children.map(convertElementToBlocks) ;
        }
        case "text": {
            //console.log( element);
            return element.value;
        }
        case "document": {
            return element.children.map(convertElementToBlocks).join('');
            // var output = "";
            // const blocks = element.children.map(convertElementToBlocks);
            // for (i=0; i< blocks.length; i++ ) {
            //     if( blocks[i] != 'Foobar') 
            //         output = output + blocks[i]
            //     else
            //         break;
            // }

        }
        
    }
    if (element.children) {
        //console.log('inside children');

        return element.children.map(convertElementToBlocks).join('');
    } else  {
        //console.log('inside no children ', element.children, ' type ', element.type, ' valuue ', element.value);

         return element.value;   
    }
    
    //console.log( 'TYPE ', element.type );
    //return element.value;
    
}

function convertToHtml(input, options) {
    return convert(input, options);
}

function convertToMarkdown(input, options) {
    var markdownOptions = Object.create(options || {});
    markdownOptions.outputFormat = "markdown";
    return convert(input, markdownOptions);
}

function convert(input, options) {
    options = readOptions(options);
    
    return unzip.openZip(input)
        .tap(function(docxFile) {
            return docxStyleMap.readStyleMap(docxFile).then(function(styleMap) {
                options.embeddedStyleMap = styleMap;
            });
        })
        .then(function(docxFile) {
            return docxReader.read(docxFile, input)
                .then(function(documentResult) {
                    return documentResult.map(options.transformDocument);
                })
                .then(function(documentResult) {
                    return convertDocumentToHtml(documentResult, options);
                });
        });
}

function readEmbeddedStyleMap(input) {
    return unzip.openZip(input)
        .then(docxStyleMap.readStyleMap);
}

function convertDocumentToHtml(documentResult, options) {
    var styleMapResult = parseStyleMap(options.readStyleMap());
    var parsedOptions = _.extend({}, options, {
        styleMap: styleMapResult.value
    });
    var documentConverter = new DocumentConverter(parsedOptions);
    
    return documentResult.flatMapThen(function(document) {
        return styleMapResult.flatMapThen(function(styleMap) {
            return documentConverter.convertToHtml(document);
        });
    });
}

function parseStyleMap(styleMap) {
    return Result.combine((styleMap || []).map(readStyle))
        .map(function(styleMap) {
            return styleMap.filter(function(styleMapping) {
                return !!styleMapping;
            });
        });
}


function extractRawText(input) {
    return unzip.openZip(input)
        .then(docxReader.read)
        .then(function(documentResult) {
            return documentResult.map(convertElementToRawText);
        });
}

function convertElementToRawText(element) {
    if (element.type === "text") {
        return element.value;
    } else {
        var tail = element.type === "paragraph" ? "\n\n" : "";
        return (element.children || []).map(convertElementToRawText).join("") + tail;
    }
}

function embedStyleMap(input, styleMap) {
    return unzip.openZip(input)
        .tap(function(docxFile) {
            return docxStyleMap.writeStyleMap(docxFile, styleMap);
        })
        .then(function(docxFile) {
            return {
                toBuffer: docxFile.toBuffer
            };
        });
}

exports.styleMapping = function() {
    throw new Error('Use a raw string instead of mammoth.styleMapping e.g. "p[style-name=\'Title\'] => h1" instead of mammoth.styleMapping("p[style-name=\'Title\'] => h1")');
};
