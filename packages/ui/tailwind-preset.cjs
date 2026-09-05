/** Shared visual vocabulary. Tokens are defined in @houdoku/ui/tokens.css. */
const color = (name) => `hsl(var(--${name}) / <alpha-value>)`;
const paired = (name) => ({ DEFAULT: color(name), foreground: color(`${name}-foreground`) });
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-ui)'] },
      colors: {
        border: color('border'),
        input: color('input'),
        ring: color('ring'),
        background: color('background'),
        foreground: color('foreground'),
        field: color('field'),
        primary: { ...paired('primary'), hover: color('primary-hover') },
        secondary: paired('secondary'),
        destructive: paired('destructive'),
        muted: paired('muted'),
        accent: paired('accent'),
        popover: paired('popover'),
        card: paired('card'),
        success: { DEFAULT: color('success'), subtle: color('success-subtle') },
        warning: { DEFAULT: color('warning'), subtle: color('warning-subtle') },
        danger: { DEFAULT: color('danger'), subtle: color('danger-subtle') },
        sidebar: {
          DEFAULT: color('sidebar-background'),
          foreground: color('sidebar-foreground'),
          primary: color('sidebar-primary'),
          'primary-foreground': color('sidebar-primary-foreground'),
          accent: color('sidebar-accent'),
          'accent-foreground': color('sidebar-accent-foreground'),
          border: color('sidebar-border'),
          ring: color('sidebar-ring'),
        },
      },
      spacing: {
        control: 'var(--control-height)',
        'control-xs': 'var(--control-height-xs)',
        'control-sm': 'var(--control-height-sm)',
        'control-lg': 'var(--control-height-lg)',
        'control-padding': 'var(--control-padding)',
        row: 'var(--row-height)',
        section: 'var(--space-section)',
        panel: 'var(--space-panel)',
        item: 'var(--space-item)',
      },
      fontSize: {
        body: ['var(--type-body)', { lineHeight: 'var(--leading-body)' }],
        caption: ['var(--type-caption)', { lineHeight: 'var(--leading-body)' }],
        'section-title': [
          'var(--type-section)',
          { lineHeight: 'var(--leading-heading)', fontWeight: '600' },
        ],
        'page-title': [
          'var(--type-title)',
          { lineHeight: 'var(--leading-heading)', fontWeight: '600' },
        ],
      },
      borderRadius: {
        sm: 'var(--radius-small)',
        md: 'var(--radius-control)',
        lg: 'var(--radius-panel)',
        control: 'var(--radius-control)',
        panel: 'var(--radius-panel)',
      },
      boxShadow: { panel: 'var(--shadow-panel)' },
      transitionDuration: { fast: 'var(--duration-fast)', normal: 'var(--duration-normal)' },
    },
  },
};
