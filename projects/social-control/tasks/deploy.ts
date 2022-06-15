import deploy from '~~projects/ngx-cms/tasks/deploy';

/**
 *
 * @param cloudRunOptions
 * @param options
 */
export default function (options: any = {}): void {
  deploy(
    Object.assign(
      {
        name: 'social-control',
        image: 'social-control',
      },
      options
    )
  );
}
