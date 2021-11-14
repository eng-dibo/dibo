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

// todo: img.logo
let toolbar: ToolbarItem[] = [
  { content: 'jobs', link: '/jobs' },
  { content: 'articles', link: '/' },
  { content: 'follow us', link: '/social' },
  { class: 'spacer' },
  { content: 'login', id: 'member' },
];
export default toolbar;
