export interface Source {
  readu8(offset: number, length: number): Promise<Uint8Array>;
}
