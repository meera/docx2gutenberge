var mammoth = require("mammoth");
const clipboardy = require('clipboardy');




var options = {
    styleMap: [
        "p[style-name='Title' => h1",
        "p[style-name='Subtitle'] => h1:fresh",
        "i => strong"
    ]
}
// mammoth.convertToHtml( {
//     path: 'testdoc.docx'
// }, options).then( function( result) {
//     var html = result.value;
//     var messages = result.messages;
//     console.log(html);
// }).done();

mammoth.converToGutenberge({path: "testdoc.docx"})
    .then(function(result){
        var text = result.value; // The raw text
        var messages = result.messages;
        console.log('Text ', result);

        clipboardy.writeSync(result);

    })
    .done();

