
var mammoth = require("./mammoth.js/lib/index");
const clipboardy = require('clipboardy');
var path = require('path');

var fs = require('fs');

console.log('Working on ', process.argv[2], '....');


const fileName = process.argv[2];


var fileParsed = path.parse(fileName);

fileParsed.dir.length
var outputFileName =  fileParsed.dir.length > 0 ? 
            fileParsed.dir + '/' + fileParsed.name + '.xml'
            : fileParsed.name + '.xml';
console.log('Base Name ', outputFileName);


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
        fs.writeFile(outputFileName, result, function (err) {
            if (err) throw err;
            console.log('Output saved into !' , outputFileName);
          });
        

    })
    .done( () => {

        console.log('... \nFinished Processing the file!');
        console.log('Output is in your clipboard. \nGo to Wordpress site, create new Topic and Paste the content!')
    });

