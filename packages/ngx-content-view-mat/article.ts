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
  copyAction?: (card: any) => string | undefined;
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

  constructor(private el: ElementRef) {}
  copy() {
    let card = this.el.nativeElement;
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
          .join('\r\r'),
        learnMore = 'learn more';

      data = `${titleText}\n\n${intro}\n${headers}\n\n${learnMore}👇👇\n${link}`;
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
}
