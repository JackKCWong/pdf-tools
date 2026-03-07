# create a npm project
run `npm init` in the project folder

# install pdfjs
run `npm install pdfjs-dist` in the project folder

# create a server.js
it serves the pdf-bbox.html, save user upload files to ./uploads and serve the pdf files uploaded by users so they can view them in the browser.

# create a pdf-bbox.html. 
it has 3 inputs:
file: allow user to upload a local pdf file
page: page number in the pdf file
bbox: a bounding box in a array<float>[8] where every pair of floats represent a point, the seq of points are [top-left, top-right, bottom-right, bottom-lef]
after upload it draw the bbox on the pdf page using canvas
