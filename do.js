
var mammoth = require("./mammoth.js/lib/index");
const clipboardy = require('clipboardy');


console.log('Working on ', process.argv[2], '....');

const fileName = process.argv[2];

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

mammoth.converToGutenberge({path: fileName})
    .then(function(result){
        var text = result.value; // The raw text
        var messages = result.messages;
        //console.log('Text ', result);

        clipboardy.writeSync(result);

    })
    .done( () => {

        console.log('Done!');
        console.log('Output is in your clipboard. \nGo to Wordpress site, create new Topic and \n Simply Paste the content!')
    });

