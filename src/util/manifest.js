/* @flow */
import path from 'path';

import fs from 'mz/fs';
import {InvalidManifest} from '../errors';
import {createLogger} from './logger';

const log = createLogger(__filename);


export default function getValidatedManifest(sourceDir: string): Promise {
  let manifestFile = path.join(sourceDir, 'manifest.json');
  log.debug(`Validating manifest at ${manifestFile}`);
  return fs.readFile(manifestFile)
    .catch((error) => {
      throw new InvalidManifest(
        `Could not read manifest.json file at ${manifestFile}: ${error}`);
    })
    .then((manifestContents) => JSON.parse(manifestContents))
    .catch((error) => {
      throw new InvalidManifest(
        `Error parsing manifest.json at ${manifestFile}: ${error}`);
    })
    .then((manifestData) => {
      let errors = [];
      // This is just some basic validation of what web-ext needs, not
      // what Firefox will need to run the extension.
      // TODO: integrate with the addons-linter for actual validation.
      if (!manifestData.name) {
        errors.push('missing "name" property');
      }
      if (!manifestData.version) {
        errors.push('missing "version" property');
      }

      // Make sure the manifest defines a gecko id.
      let idProps = ['applications', 'gecko', 'id'];
      var propPath = '';
      var objectToCheck = manifestData;

      for (let nextProp of idProps) {
        propPath = propPath ? `${propPath}.${nextProp}` : nextProp;
        objectToCheck = objectToCheck[nextProp];
        if (!objectToCheck) {
          errors.push(`missing "${propPath}" property`);
          break;
        }
      }

      if (errors.length) {
        throw new InvalidManifest(
          `Manifest at ${manifestFile} is invalid: ${errors.join('; ')}`);
      }
      return manifestData;
    });
}
