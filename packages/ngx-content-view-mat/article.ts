import { Component, Input, ElementRef } from '@angular/core';

interface Obj {
  [key: string]: any;
}

export interface Article extends Obj {
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

export interface Keywords extends Obj {
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

export interface ArticleOptions extends Obj {
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

  constructor(private el: ElementRef) {
    let quickActions: Array<QuickActionsElement> = [
      // todo: issue,  `action: this.copy` makes `this` inside copy() refers to this array element
      // i.e {icon, action} instead of the component
      { icon: 'content_copy', action: () => this.copy(this.el.nativeElement) },
      { icon: 'share', action: () => this.share(this.el.nativeElement) },
    ];

    // remove duplicates (action elements from parent component overrides default action elements)
    // todo: if(options && !action) add options to quickActions element
    if (this.options.quickActions instanceof Array) {
      quickActions = quickActions.filter((defaultAction) => {
        !this.options.quickActions!.some(
          (action) => action.icon === defaultAction.icon
        );
      });
    }

    this.opts = Object.assign({}, this.options || {}, { quickActions });
  }

  copy(card?: any) {
    card = card || this.el.nativeElement;
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
      let title = card.getElementsByTagName('mat-card-title')[0],
        titleText = title.textContent,
        // todo: shorten link -> /$type/~$id
        link = title.getElementsByTagName('a')[0].href;

      // shorten url
      let url = new URL(link);
      url.pathname = url.pathname.replace(
        /([^\/]+)\/(?:[^\/]+)\/.+~([^\/?]+)/,
        '$1/~$2'
      );
      link = url.href;

      // todo: intro is the text before the first <h2> element
      let content = card.getElementsByTagName('mat-card-content')[0],
        intro = content.textContent.substr(0, 500),
        headers = [...content.querySelectorAll('h2')]
          .map((el) => el.textContent)
          .join('\r\r');

      // todo: use template, example: options.template='{{content.title}}\n{{content.link}}'
      data = `${titleText}\n\n${intro}\n${headers} 👇👇\n${link}`;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(data).then(
        function () {
          // todo: add a tooltip to the copy button
          console.log(`copied!!`);
        },
        function (err) {
          console.error('Async: Could not copy text: ', err);
        }
      );
    } else {
      // https://dev.to/tqbit/how-to-use-javascript-to-copy-text-to-the-clipboard-2hi2
      let area = document.createElement('textarea');
      area.value = data;
      document.body.appendChild(area);
      area.select();
      if (document.execCommand('copy')) {
        console.log(`copied!!`);
      }
      document.body.removeChild(area);
    }
  }

  share(card?: any) {
    // todo: open a popup with sharebuttons
    card = card || this.el.nativeElement;

    if (this.options && typeof this.options!.shareAction === 'function') {
      let shareAction = this.options!.shareAction(card);
    }

    let title = card.getElementsByTagName('mat-card-title')[0],
      titleText = title.textContent,
      link = title.getElementsByTagName('a')[0].href;
  }
}
