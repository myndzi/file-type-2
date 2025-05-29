export type MimeString = `${string}/${string}`;
export type Ext = string & { __brand__: 'ext' };
export type Mime = MimeString & { __brand__: 'mime' };
export type Codec = string & { __brand__: 'codec' };
export type Profile = string & { __brand__: 'profile' };
