import { TTextColor } from "../../packages/core/dist/Nishan";

export type TFor =
  "Javascript" |
  "Python" |
  "Node" |
  "CSS" |
  "HTML" |
  "SQL" |
  "React" |
  "Typescript" |
  "Graphql" |
  "Markdown" |
  "Mongodb";

export const fors: [TFor, TTextColor][] = [
  ["Javascript", "yellow"],
  ["Python", "blue"],
  ["Node", "green"],
  ["CSS", "blue"],
  ["HTML", "orange"],
  ["SQL", "purple"],
  ["React", "blue"],
  ["Typescript", "blue"],
  ["Graphql", "pink"],
  ["Markdown", "default"],
  ["Mongodb", "green"],
].sort((a, b) => a[0] > b[0] ? 1 : -1) as [TFor, TTextColor][] 
