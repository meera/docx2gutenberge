This is utility to convert docx documents to wordpress document. 
This is not a generic purposed script. It is highly customized to fit one special need.

# Known Issues

* Italic for Header is retained.
* Column layout are not automatically created.
* .doc format is not supported.

# Install 

Step 1) You will need to have npm and node installed on your machine. 
You can download npm+node from https://nodejs.org/en/

Step 2) You will need git - git is preinstalled on all Mac machines. If you don't have it you can install on github.

Step 3) Open terminal window, and run this commamnd 

``` 
git clone https://github.com/meera/docx2gutenberge.git
```

Step 4) now  install the dependencies
```
npm install
```

The script is ready for use.

# Usage

Step 1) Open the file you like to convert into Word or any other equivalent software.
Step 2) Save the file as .docx in current directory
Step 3) Run the script using this command

```
node do.js <filename.docx>
```
Credits:
https://www.npmjs.com/package/mammoth

Thank you mammoth.js! 