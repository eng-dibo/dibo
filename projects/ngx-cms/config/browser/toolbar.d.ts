// todo: all properties for HtmlElement
// todo: move to pkg: html (dynamically create html elements)
// todo: {property: string|()=>string}
// todo: support sub-tags (i.e: {content: string | HtmlElement})
// example: <a> <im /> </a>

export interface HtmlElement {
  tag?: string;
  click?: string | (() => void);
  class?: string;
  id?: string;
  link?: string;
  content?: string;
}
export interface Img extends HtmlElement {
  src?: string;
  width?: string;
  height?: string;
  alt?: string;
}

// todo: ToolbarItem = {Img|...}
export interface ToolbarItem extends HtmlElement {
  title?: string;
}
declare let toolbar: ToolbarItem[];
export default toolbar;
