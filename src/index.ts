import * as allChecks from './checkers/checkers.js';

export const createChecker = ({ exts, mimes }: { exts?: string[]; mimes?: string[] } = {}) => {
  const _exts = exts ? new Set(exts) : undefined;
  const _mimes = mimes ? new Set(mimes) : undefined;

  const checks = Object.values(allChecks).filter(check => {
    if (_mimes && !_mimes.has(check.mime)) return false;
    if (_exts && !check.exts.some(ext => _exts.has(ext))) return false;
    return true;
  });
};
