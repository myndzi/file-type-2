// https://www.openoffice.org/framework/documentation/mimetypes/mimetypes.html

import { bytes, Simple, stringf } from './simple.js';

export const odfBase = Simple.of(
  '/',
  [],
  bytes(['P'.charCodeAt(0), 'K'.charCodeAt(0), 0x03, 0x04]),
);

// note: children of "odf" have their offset adjusted by -4 to account
// for the 4 bytes consumed by the PK\x03\x04 check
// note: simple check doesn't support length-value checking, so
// this will match only mimetypes that have the specified value
// as a prefix -- meaning it's not _strictly_ correct yet
export const epub = Simple.childOf(
  odfBase,
  'application/epub+zip',
  'epub',
  stringf('mimetype' + 'application/epub+zip', 30 - 4),
);
export const odt = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenDocument Text
  odfBase,
  'application/vnd.oasis.opendocument.text',
  'odt',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.text', 30 - 4),
);
export const ott = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenDocument Text Template
  odfBase,
  'application/vnd.oasis.opendocument.text-template',
  'ott',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.text-template', 30 - 4),
);
export const oth = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later HTML Document Template
  odfBase,
  'application/vnd.oasis.opendocument.text-web',
  'oth',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.text-web', 30 - 4),
);
export const odm = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenDocument Master Document
  odfBase,
  'application/vnd.oasis.opendocument.text-master',
  'odm',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.text-master', 30 - 4),
);
export const odg = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenDocument Drawing
  odfBase,
  'application/vnd.oasis.opendocument.graphics',
  'odg',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.graphics', 30 - 4),
);
export const otg = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenDocument Drawing Template
  odfBase,
  'application/vnd.oasis.opendocument.graphics-template',
  'otg',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.graphics-template', 30 - 4),
);
export const odp = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenDocument Presentation
  odfBase,
  'application/vnd.oasis.opendocument.presentation',
  'odp',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.presentation', 30 - 4),
);
export const otp = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenDocument Presentation Template
  odfBase,
  'application/vnd.oasis.opendocument.presentation-template',
  'otp',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.presentation-template', 30 - 4),
);
export const ods = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenDocument Spreadsheet
  odfBase,
  'application/vnd.oasis.opendocument.spreadsheet',
  'ods',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.spreadsheet', 30 - 4),
);
export const ots = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenDocument Spreadsheet Template
  odfBase,
  'application/vnd.oasis.opendocument.spreadsheet-template',
  'ots',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.spreadsheet-template', 30 - 4),
);
export const odc = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenDocument Chart
  odfBase,
  'application/vnd.oasis.opendocument.chart',
  'odc',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.chart', 30 - 4),
);
export const odf = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenDocument Formula
  odfBase,
  'application/vnd.oasis.opendocument.formula',
  'odf',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.formula', 30 - 4),
);
export const odb = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenDocument Database
  odfBase,
  'application/vnd.oasis.opendocument.database',
  'odb',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.database', 30 - 4),
);
export const odi = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenDocument Image
  odfBase,
  'application/vnd.oasis.opendocument.image',
  'odi',
  stringf('mimetype' + 'application/vnd.oasis.opendocument.image', 30 - 4),
);
export const oxt = Simple.childOf(
  //OpenOffice.org2.0 / StarOffice 8 and later OpenOffice.org extension (since OOo 2.1)
  odfBase,
  'application/vnd.openofficeorg.extension',
  'oxt',
  stringf('mimetype' + 'application/vnd.openofficeorg.extension', 30 - 4),
);
export const sxw = Simple.childOf(
  //OpenOffice.org1.0 / StarOffice6.0 and later This mime content type will be used for Writer 6.0 documents.
  odfBase,
  'application/vnd.sun.xml.writer',
  'sxw',
  stringf('mimetype' + 'application/vnd.sun.xml.writer', 30 - 4),
);
export const stw = Simple.childOf(
  //OpenOffice.org1.0 / StarOffice6.0 and later This mime content type will be used for Writer 6.0 templates.
  odfBase,
  'application/vnd.sun.xml.writer.template',
  'stw',
  stringf('mimetype' + 'application/vnd.sun.xml.writer.template', 30 - 4),
);
export const sxc = Simple.childOf(
  //OpenOffice.org1.0 / StarOffice6.0 and later This mime content type will be used for Calc 6.0 spreadsheets.
  odfBase,
  'application/vnd.sun.xml.calc',
  'sxc',
  stringf('mimetype' + 'application/vnd.sun.xml.calc', 30 - 4),
);
export const stc = Simple.childOf(
  //OpenOffice.org1.0 / StarOffice6.0 and later This mime content type will be used for Calc 6.0 templates.
  odfBase,
  'application/vnd.sun.xml.calc.template',
  'stc',
  stringf('mimetype' + 'application/vnd.sun.xml.calc.template', 30 - 4),
);
export const sxd = Simple.childOf(
  //OpenOffice.org1.0 / StarOffice6.0 and later This mime content type will be used for Draw 6.0 documents.
  odfBase,
  'application/vnd.sun.xml.draw',
  'sxd',
  stringf('mimetype' + 'application/vnd.sun.xml.draw', 30 - 4),
);
export const std = Simple.childOf(
  //OpenOffice.org1.0 / StarOffice6.0 and later This mime content type will be used for Draw 6.0 templates.
  odfBase,
  'application/vnd.sun.xml.draw.template',
  'std',
  stringf('mimetype' + 'application/vnd.sun.xml.draw.template', 30 - 4),
);
export const sxi = Simple.childOf(
  //OpenOffice.org1.0 / StarOffice6.0 and later This mime content type will be used for Impress 6.0 presentations.
  odfBase,
  'application/vnd.sun.xml.impress',
  'sxi',
  stringf('mimetype' + 'application/vnd.sun.xml.impress', 30 - 4),
);
export const sti = Simple.childOf(
  //OpenOffice.org1.0 / StarOffice6.0 and later This mime content type will be used for Impress 6.0 templates.
  odfBase,
  'application/vnd.sun.xml.impress.template',
  'sti',
  stringf('mimetype' + 'application/vnd.sun.xml.impress.template', 30 - 4),
);
export const sxg = Simple.childOf(
  //OpenOffice.org1.0 / StarOffice6.0 and later This mime content type will be used for Writer 6.0 global documents.
  odfBase,
  'application/vnd.sun.xml.writer.global',
  'sxg',
  stringf('mimetype' + 'application/vnd.sun.xml.writer.global', 30 - 4),
);
export const sxm = Simple.childOf(
  //OpenOffice.org1.0 / StarOffice6.0 and later This mime content type will be used for Math 6.0 documents.
  odfBase,
  'application/vnd.sun.xml.math',
  'sxm',
  stringf('mimetype' + 'application/vnd.sun.xml.math', 30 - 4),
);
export const sdw5x = Simple.childOf(
  //StarOffice 5.x This mime content type will be used for StarWriter 5.x documents.
  odfBase,
  'application/vnd.stardivision.writer',
  'sdw',
  stringf('mimetype' + 'application/vnd.stardivision.writer', 30 - 4),
);
export const sgl5x = Simple.childOf(
  //StarOffice 5.x This mime content type will be used for StarWriter 5.x global documents.
  odfBase,
  'application/vnd.stardivision.writer-global',
  'sgl',
  stringf('mimetype' + 'application/vnd.stardivision.writer-global', 30 - 4),
);
export const sdc5x = Simple.childOf(
  //StarOffice 5.x This mime content type will be used for StarCalc 5.x spreadsheets.
  odfBase,
  'application/vnd.stardivision.calc',
  'sdc',
  stringf('mimetype' + 'application/vnd.stardivision.calc', 30 - 4),
);
export const sda5x = Simple.childOf(
  //StarOffice 5.x This mime content type will be used for StarDraw 5.x documents.
  odfBase,
  'application/vnd.stardivision.draw',
  'sda',
  stringf('mimetype' + 'application/vnd.stardivision.draw', 30 - 4),
);
export const sdd5x = Simple.childOf(
  //StarOffice 5.x This mime content type will be used for StarImpress 5.x presentations.
  odfBase,
  'application/vnd.stardivision.impress',
  'sdd',
  stringf('mimetype' + 'application/vnd.stardivision.impress', 30 - 4),
);
export const sdp5x = Simple.childOf(
  //StarOffice 5.x This mime content type will be used for StarImpress Packed 5.x files.
  odfBase,
  'application/vnd.stardivision.impress-packed',
  'sdp',
  stringf('mimetype' + 'application/vnd.stardivision.impress-packed', 30 - 4),
);
export const smf5x = Simple.childOf(
  //StarOffice 5.x This mime content type will be used for StarMath 5.x documents.
  odfBase,
  'application/vnd.stardivision.math',
  'smf',
  stringf('mimetype' + 'application/vnd.stardivision.math', 30 - 4),
);
export const sds5x = Simple.childOf(
  //StarOffice 5.x This mime content type will be used for StaChart 5.x documents.
  odfBase,
  'application/vnd.stardivision.chart',
  'sds',
  stringf('mimetype' + 'application/vnd.stardivision.chart', 30 - 4),
);
export const sdm5x = Simple.childOf(
  //StarOffice 5.x This mime content type will be used for StarMail 5.x mail files.
  odfBase,
  'application/vnd.stardivision.mail',
  'sdm',
  stringf('mimetype' + 'application/vnd.stardivision.mail', 30 - 4),
);
export const sdw4x = Simple.childOf(
  //StarOffice 4.x This mime content type will be used for StarWriter 4.x documents.
  odfBase,
  'application/x-starwriter',
  'sdw',
  stringf('mimetype' + 'application/x-starwriter', 30 - 4),
);
export const sdc4x = Simple.childOf(
  //StarOffice 4.x This mime content type will be used for StarCalc 4.x spreadsheets.
  odfBase,
  'application/x-starcalc',
  'sdc',
  stringf('mimetype' + 'application/x-starcalc', 30 - 4),
);
export const sda4x = Simple.childOf(
  //StarOffice 4.x This mime content type will be used for StarDraw 4.x documents.
  odfBase,
  'application/x-stardraw',
  'sda',
  stringf('mimetype' + 'application/x-stardraw', 30 - 4),
);
export const sdd4x = Simple.childOf(
  //StarOffice 4.x This mime content type will be used for StarImpress 4.x presentations.
  odfBase,
  'application/x-starimpress',
  'sdd',
  stringf('mimetype' + 'application/x-starimpress', 30 - 4),
);
export const smf4x = Simple.childOf(
  //StarOffice 4.x This mime content type will be used for StarMath 4.x documents.
  odfBase,
  'application/x-starmath',
  'smf',
  stringf('mimetype' + 'application/x-starmath', 30 - 4),
);
export const sds4x = Simple.childOf(
  //StarOffice 4.x This mime content type will be used for StarChart 4.x documents.
  odfBase,
  'application/x-starchart',
  'sds',
  stringf('mimetype' + 'application/x-starchart', 30 - 4),
);
