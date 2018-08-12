/**
 * Defines plugins for use with Jest.
 *
 * @see https://jestjs.io/docs/en/configuration.html#setuptestframeworkscriptfile-string
 */

'use strict';

// Allows assertions to be chained together, to reduce repetition.
// @see https://github.com/mattphillips/jest-chain#usage
require( 'jest-chain' );

// Adds a bunch of additional matchers to Jest.
// @see https://github.com/jest-community/jest-extended#api
require( 'jest-extended' );
