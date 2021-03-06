const AWS = require('aws-sdk');
const fs = require('fs');
const chokidar = require('chokidar');
const config = require('./config.json');

//configuring the AWS environment
AWS.config.update({
  accessKeyId:  config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  region: config.region,
});

let s3 = new AWS.S3();

let watcher = chokidar.watch(config.folder, {ignored: /^\./, persistent: true});
let scanComplete = false;

if(process.argv.includes("--all")){
  scanComplete = true;
}

watcher
  .on('ready', () => {
    scanComplete = true;
  })
  .on('add', function(path) {
    // console.log('File', path, 'has been added');
    if(scanComplete){
      saveFile(path);
    }
  })
  .on('change', function(path) {
    // console.log('File', path, 'has been changed');
    if(scanComplete){
      saveFile(path);
    }
  })
  .on('unlink', function(path) {
    // console.log('File', path, 'has been removed');
    if(scanComplete){
      deleteFile(path);
    }
  })
  .on('error', function(error) {
    console.error('Error happened', error);
  })

async function saveFile(filePath){
  let fileName = "images" + filePath.replace(config.folder,  "");
  fileName = fileName.split('\\');
  fileName = fileName.join("/");
  console.log("Upload Started:", fileName )

  // configuring parameters
  var params = {
    Bucket: config.bucketName,
    Body : fs.createReadStream(filePath),
    Key : fileName
  };

  return await s3.upload(params, function (err, data) {
    // handle error
    if (err) {
      console.log("Error", err);
    }

    // success
    if (data) {
      console.log("Uploaded file:", data.Location);
    }
  });
}

async function deleteFile(filePath){

  let fileName = filePath.replace(config.folder,  "");
  fileName = fileName.split('\\');
  fileName = fileName.join("/");

  // configuring parameters
  var params = {
    Bucket: config.bucketName,
    Key : fileName
  };

  return await s3.deleteObject(params, function (err, data) {
    // handle error
    if (err) {
      console.log("Error", err);
    }

    // success
    if (data) {
      console.log("Deleted file:", fileName);
    }
  });
}

var params = {
  Bucket: config.bucketName
};
 s3.listObjects(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else     console.log(data);           // successful response
 });

 var params = {
  Bucket: config.bucketName,
  Key: "images/IMG_7894.JPG"
};

const filePath = './temp/IMG_7894.JPG';
console.log(filePath)
let file = fs.createWriteStream(filePath);
// s3.getObject(params, function(err, data) {
//    if (err) return console.log(err, err.stack); // an error occurred
//   fs.writeFileSync(filePath, data.Body.toString())
//   console.log(`${filePath} has been created!`)
//  });

return new Promise((resolve, reject) => {
  s3.getObject(params).createReadStream()
  .on('end', () => {
      return resolve();
  })
  .on('error', (error) => {
      return reject(error);
  }).pipe(file);
});


