export default {
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'date', title: 'Date', type: 'string' },
    { name: 'description', title: 'Description', type: 'string' },
    { name: 'image', title: 'Image', type: 'image', options: { hotspot: true } },
    {
      name: 'asciiEffect',
      title: 'ASCII hover effect',
      description:
        'How the ASCII-art thumbnail on the Projects page animates on hover. Leave empty for the default scramble.',
      type: 'string',
      options: {
        layout: 'dropdown',
        list: [
          { title: 'Default (scramble wave)', value: 'default' },
          { title: 'Glitch (slices + red/cyan split)', value: 'glitch' },
          { title: 'Draw (erase, then redraw along the strokes)', value: 'draw' },
          { title: 'Fill (fills in row by row)', value: 'fill' },
          { title: 'Assemble (scatter, then snap together)', value: 'assemble' },
        ],
      },
    },
    {
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'heading', title: 'Heading', type: 'string' },
            { name: 'body', title: 'Body', type: 'text' },
          ],
        },
      ],
    },
  ],
}