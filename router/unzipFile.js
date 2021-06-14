'use strict';

const path = require('path');
const getClientIp = require('../utils/get-client-ip');
const AdmZip = require("adm-zip");
const {unrar, list} = require('unrar-promise');

const isRarFile = filePath => {
  const ext = path.extname(filePath).slice(1);
  const zipExtensions= ["rar" ]

  if (ext && zipExtensions.includes(ext) ) {
    return true
  }
  return false
}

module.exports = ({
  config,
  req,
  res,
  handleError,
  path: userPath
}) => {
  if (config.readOnly) {
    return handleError(Object.assign(
      new Error(`File Manager is in read-only mode`),
      { httpCode: 403 }
    ));
  }

  if (userPath === path.sep) {
    return handleError(Object.assign(
      new Error(`User root must never be Unzip`),
      { httpCode: 400 }
    ));
  }

  const absPath = path.join(config.fsRoot, userPath);
  const unzipToPath= path.dirname(absPath)

  config.logger.info(`Unzip ${absPath} to ${unzipToPath} requested by ${getClientIp(req)}`);
  if( isRarFile(absPath) ){
    unrar(absPath, unzipToPath)
    .then( ()=> res.status(200).end())
    .catch( err=> handleError(err) )
  }else{
    try {
      // reading archives
      var zip = new AdmZip(absPath);
      // extracts everything
      zip.extractAllTo(unzipToPath, /*overwrite*/ true);
      res.status(200).end()
    } catch (error) {
      handleError(error)
    }
  }
};