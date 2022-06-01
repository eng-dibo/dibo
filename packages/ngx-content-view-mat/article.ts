import { Component, ElementRef, Input } from '@angular/core';
import { replaceAll } from '@engineers/javascript/string';

interface Object_ {
  [key: string]: any;
}

export interface Article extends Object_ {
  id?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  // todo: if(keywords:string)keywords=keywords.split(',').map(text=>({text}))
  keywords?: Keywords[];
  cover?: Image;
  // todo: img?: string | Image
  author?: { name?: string; image?: string; link?: string };
  link?: string;
  createdAt?: string;
  updatedAt?: string;
  // whether to display the copy button
  copyButton?: boolean;
}

export interface Keywords extends Object_ {
  text: string;
  count?: number | string;
  link?: string;
  target?: string;
}

// todo: convert <img data-ngx-img="img: Image"> to <img>
export interface Image {
  src?: string;
  srcset?: string;
  sizes?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ArticleOptions extends Object_ {
  // tag used for title, default: <h1>
  titleTag?: string;
  // todo: move to options.quickActions[icon:content_copy, options:{getData()}]
  copyAction?: (card: any) => string | undefined;
  // add action elements to quickActions bar
  quickActions?: Array<QuickActionsElement>;
}

export interface QuickActionsElement {
  // material icon
  icon: string;
  action?: (card?: any) => any;
  // todo: pass options instead of action to control the default action instead of overriding it
  options?: { [key: string]: any };
}

@Component({
  selector: 'ngx-content-article',
  templateUrl: './article.html',
  styleUrls: ['./view.scss'],
})
export class NgxContentArticleComponent {
  @Input() data!: Article;
  @Input() type!: string;
  @Input() options: ArticleOptions = {};
  opts!: ArticleOptions;

  constructor(private element: ElementRef) {
    let quickActions: Array<QuickActionsElement> = [
      // todo: issue,  `action: this.copy` makes `this` inside copy() refers to this array element
      // i.e {icon, action} instead of the component
      { icon: 'content_copy', action: () => this.copy(this.el.nativeElement) },
      { icon: 'share', action: () => this.share(this.el.nativeElement) },
    ];

    // remove duplicates (action elements from parent component overrides default action elements)
    // todo: if(options && !action) add options to quickActions element
    if (Array.isArray(this.options.quickActions)) {
      quickActions = quickActions.filter((defaultAction) => {
        !this.options.quickActions!.some(
          (action) => action.icon === defaultAction.icon
        );
      });
    }

    this.opts = Object.assign({}, this.options || {}, { quickActions });
  }

  copy(card?: HTMLElement) {
    // todo: clone the node element, so any modification (such as removing links)
    // doesn't affect the original element
    // this removes line breaks from card.innerText
    // card = (card || this.el.nativeElement).cloneNode(true) as HTMLElement;
    card = card || (this.el.nativeElement as HTMLElement);
    let data: string | undefined;

    if (this.options && this.options!.copyAction) {
      let copyAction = this.options!.copyAction(card);
      if (typeof copyAction === 'string') {
        // todo: enable template variables (ejs)
        // ex: copyAction()=>'{{title}}\n{{link}}'
        data = copyAction;
      }
    }

    if (!data) {
      // todo: use referrer2
      let title = card.querySelector('mat-card-title'),
        titleText = title?.textContent,
        link = title?.querySelector('a')?.href;

      // shorten url
      if (link) {
        let url = new URL(link);
        url.pathname = url.pathname.replace(
          /([^/]+)\/[^/]+\/.+~([^/?]+)/,
          '$1/~$2'
        );
        link = url.href;
      }

      let content = card.querySelector('.ql-editor') as HTMLElement;
      if (content) {
        let headers = [...(content?.querySelectorAll('h2') || [])],
          headersText = headers
            ? headers
                .map((element: HTMLElement) => `- ${element.textContent}`)
                .join('\n')
            : '',
          intro;

        if (headers.length > 0) {
          // intro is all elements before the first header
          let els = [];
          let element = headers[0].previousElementSibling;
          while (element) {
            els.unshift(element as HTMLElement);
            element = element.previousElementSibling;
          }
          intro = els.map((element) => element.innerText.trim()).join('\n');
        } else {
          intro = content?.innerText?.trim();
        }

        // remove links from intro, to prevent wrong link preview on social platforms
        // from @engineers/ngx-content-core/pipes-functions
        // except: doesn't exist inside <a>
        let unallowedUrlChars = ` "'\`\n<>[\\]`;
        let tdl = 'com|net|org';
        let linkPattern = new RegExp(
          `((?:(?:ftp|http)s?)+:\/\/[^ ${unallowedUrlChars}]+` +
            `|[^ ${unallowedUrlChars}\\/]+\\.(?:${tdl})(?:\.[a-z]{2}){0,1})` +
            `(?::\d+)?` +
            `(?:\/[^ ${unallowedUrlChars}]+)*`,
          'gi'
        );

        intro = (
          replaceAll(intro.replace(linkPattern, ''), '\n\n', '\n') as string
        ).slice(0, 500);

        // todo: use template, example: options.template='{{titleText}}\n{{link}}'
        data = `${titleText}\n\n${intro}\n\n${headersText}\n\n👇👇\n${link}`;
      } else {
        data = `${titleText}\n${link}`;
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(data).then(
        function () {
          // todo: add a tooltip to the copy button
          console.log(`copied!!`);
        },
        function (error) {
          console.error('Async: Could not copy text:', error);
        }
      );
    } else {
      // https://dev.to/tqbit/how-to-use-javascript-to-copy-text-to-the-clipboard-2hi2
      let area = document.createElement('textarea');
      area.value = data;
      document.body.append(area);
      area.select();
      if (document.execCommand('copy')) {
        console.log(`copied!!`);
      }
      area.remove();
    }
  }

  share(card?: any) {
    // todo: open a popup with sharebuttons
    card = card || this.el.nativeElement;

    if (this.options && typeof this.options!.shareAction === 'function') {
      let shareAction = this.options!.shareAction(card);
    }

    let title = card.querySelectorAll('mat-card-title')[0],
      titleText = title.textContent,
      link = title.querySelectorAll('a')[0].href;
  }
}
