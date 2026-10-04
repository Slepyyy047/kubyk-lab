import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSaved } from '../src/storage';
import { exampleColors, validate, solveFacelets } from '../src/cube';

afterEach(()=>vi.unstubAllGlobals());
function saved(raw:unknown) {vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(raw)});}
describe('persistent input and verified playback progress',()=>{
  it('restores a real solution and completed move prefix',()=>{
    const input=exampleColors();const v=validate(input);if(!v.ok)throw Error(v.error);
    const moves=solveFacelets(v.facelets);saved({input,solution:{facelets:v.facelets,moves,centers:[]},step:2,speed:1.5});
    const result=readSaved();expect(result?.step).toBe(2);expect(result?.solution?.moves).toEqual(moves);expect(result?.solution?.centers).toEqual(['white','red','green','yellow','orange','blue']);
  });
  it('keeps valid input but discards fabricated moves that do not solve it',()=>{
    const input=exampleColors();const v=validate(input);if(!v.ok)throw Error(v.error);
    saved({input,solution:{facelets:v.facelets,moves:['U']},step:1,speed:8});
    expect(readSaved()).toMatchObject({input,solution:null,step:0,speed:1});
  });
  it('discards corrupt payloads and unknown colors',()=>{
    saved({input:Array(54).fill('pink')});expect(readSaved()).toBeNull();
    vi.stubGlobal('localStorage',{getItem:()=>'{invalid json'});expect(readSaved()).toBeNull();
  });
  it('handles blocked browser storage',()=>{
    vi.stubGlobal('localStorage',{getItem:()=>{throw new Error('Blocked')}});expect(readSaved()).toBeNull();
  });
});
