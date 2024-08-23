import minimist, {ParsedArgs} from 'minimist';

export function parse(argv: string[]): ParsedArgs {
  return minimist(argv.slice(2));
}
