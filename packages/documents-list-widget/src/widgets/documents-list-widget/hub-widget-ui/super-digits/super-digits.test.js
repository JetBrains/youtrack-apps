/* eslint-disable no-magic-numbers */
/* eslint-disable no-undef */
import {expect} from 'chai';

import toSuperDigitsString from './super-digits.js';

describe('toSuperDigitsString', () => {
  it('zero', () => {
    expect(toSuperDigitsString(0)).to.equal('⁰');
  });
  it('one digit', () => {
    expect(toSuperDigitsString(3)).to.equal('³');
  });
  it('7 digits', () => {
    expect(toSuperDigitsString(2128506)).to.equal('²¹²⁸⁵⁰⁶');
  });
  it('negative number', () => {
    expect(toSuperDigitsString(-42)).to.equal('⁻⁴²');
  });
});
