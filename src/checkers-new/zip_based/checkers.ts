import { apkSingleton } from './apk.js';
import { zipSingleton } from './zip.js';
import { ZipSimple } from './zip_simple.js';

export const zip = zipSingleton;
export const xpi = ZipSimple.of('application/x-xpinstall', 'xpi', 'META-INF/mozilla.rsa');
export const jar = ZipSimple.of('application/java-archive', 'jar', 'META-INF/MANIFEST.MF');
export const apk = apkSingleton;

// class
// 						case "mimetype":
// 							return {
// 								async handler(fileData) {
// 									// Use TextDecoder to decode the UTF-8 encoded data
// 									const mimeType = new TextDecoder("utf-8")
// 										.decode(fileData)
// 										.trim();
// 									fileType = getFileTypeFromMimeType(mimeType);
// 								},
// 								stop: true,
// 							};

// 						case "[Content_Types].xml":
// 							return {
// 								async handler(fileData) {
// 									// Use TextDecoder to decode the UTF-8 encoded data
// 									let xmlContent = new TextDecoder("utf-8").decode(fileData);
// 									const endPos = xmlContent.indexOf('.main+xml"');
// 									if (endPos === -1) {
// 										const mimeType =
// 											"application/vnd.ms-package.3dmanufacturing-3dmodel+xml";
// 										if (xmlContent.includes(`ContentType="${mimeType}"`)) {
// 											fileType = getFileTypeFromMimeType(mimeType);
// 										}
// 									} else {
// 										xmlContent = xmlContent.slice(0, Math.max(0, endPos));
// 										const firstPos = xmlContent.lastIndexOf('"');
// 										const mimeType = xmlContent.slice(
// 											Math.max(0, firstPos + 1),
// 										);
// 										fileType = getFileTypeFromMimeType(mimeType);
// 									}
// 								},
// 								stop: true,
// 							};
// 						default:
// 							if (/classes\d*\.dex/.test(zipHeader.filename)) {
// 								fileType = {
// 									ext: "apk",
// 									mime: "application/vnd.android.package-archive",
// 								};
// 								return { handler: false, stop: true };
// 							}

// 							return { handler: false };
// 					}
// 				},
// 			);
