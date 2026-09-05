import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BookOpen,
  Check,
  ChevronRight,
  LayoutGrid,
  Moon,
  Search,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { Button } from '@houdoku/ui/components/Button';
import { Input } from '@houdoku/ui/components/Input';
import { Badge } from '@houdoku/ui/components/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@houdoku/ui/components/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@houdoku/ui/components/Select';
import { Checkbox } from '@houdoku/ui/components/Checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@houdoku/ui/components/Dialog';
import './style.css';

const books = [
  {
    title: 'The Last Train',
    author: 'A. Mori',
    genre: 'Adventure',
    color: '--palette-blue',
    description:
      'A conductor follows an unfamiliar route through a city that changes after sunset.',
  },
  {
    title: 'After the Rain',
    author: 'S. Kato',
    genre: 'Drama',
    color: '--palette-slate',
    description: 'Two neighbors rebuild an old garden and discover the stories left behind.',
  },
  {
    title: 'Blue Hour',
    author: 'R. Aoki',
    genre: 'Mystery',
    color: '--palette-blue-deep',
    description: 'A photograph reveals a place that nobody in the town remembers.',
  },
  {
    title: 'Paper Moons',
    author: 'N. Sora',
    genre: 'Adventure',
    color: '--palette-green',
    description: 'An apprentice mapmaker sets out to chart the islands beyond the last lighthouse.',
  },
  {
    title: 'A Quiet Season',
    author: 'K. Ito',
    genre: 'Drama',
    color: '--palette-amber',
    description: 'A small bookshop opens its doors for one final summer.',
  },
];
const tabs = ['In context', 'Foundations', 'Components'] as const;
type Tab = (typeof tabs)[number];

function App() {
  const [theme, setTheme] = useState('dark');
  const [density, setDensity] = useState('comfortable');
  const [tab, setTab] = useState<Tab>('In context');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(true);
  const [adventure, setAdventure] = useState(false);
  const [selected, setSelected] = useState<(typeof books)[number] | null>(null);
  const [added, setAdded] = useState<string[]>(['After the Rain']);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.density = density;
  }, [theme, density]);
  const visible = books.filter(
    (book) =>
      book.title.toLowerCase().includes(query.toLowerCase()) &&
      (!adventure || book.genre === 'Adventure'),
  );
  const swatches = ['background', 'card', 'popover', 'primary', 'muted-foreground', 'border'];
  return (
    <div className="review-shell">
      <aside className="review-nav">
        <div>
          <div className="review-brand flex items-center gap-2">
            <BookOpen size={20} /> Rensai
          </div>
          <p className="text-caption text-muted-foreground mt-1">Design foundations</p>
        </div>
        <nav aria-label="Design review sections" className="flex flex-col gap-1">
          {tabs.map((item) => (
            <Button
              key={item}
              variant={tab === item ? 'secondary' : 'ghost'}
              aria-current={tab === item ? 'page' : undefined}
              onClick={() => setTab(item)}
            >
              {item}
            </Button>
          ))}
        </nav>
        <footer className="mt-auto text-caption text-muted-foreground leading-relaxed">
          Shared tokens and real UI components.
          <br />
          Fictional series. No source connections.
        </footer>
      </aside>
      <main className="review-main">
        <header className="review-header">
          <div>
            <p className="text-muted-foreground mb-2">Interface direction / 01</p>
            <h1 className="text-page-title tracking-tight">A library built around reading</h1>
            <p className="text-muted-foreground mt-3 max-w-xl">
              Distinct surfaces, readable labels, and consistent controls. Artwork gets space
              without taking over the interface.
            </p>
          </div>
          <div className="review-controls">
            <Button
              id="theme-toggle"
              variant="outline"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </Button>
            <Button
              id="density-toggle"
              variant="outline"
              onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
            >
              <LayoutGrid />
              {density === 'comfortable' ? 'Comfortable' : 'Compact'}
            </Button>
          </div>
        </header>
        {tab === 'In context' && (
          <>
            <div className="flex justify-between items-end mb-4 gap-4">
              <div>
                <h2 className="text-section-title">Browse and inspect</h2>
                <p className="text-muted-foreground mt-1">
                  A small example of the foundation in use. The app page is the next step.
                </p>
              </div>
              <Badge variant="outline">Interactive example</Badge>
            </div>
            <Card>
              <CardHeader className="border-b">
                <div className="flex justify-between gap-4">
                  <div>
                    <CardTitle>Add series</CardTitle>
                    <p className="text-caption text-muted-foreground mt-2">Find your next read</p>
                  </div>
                  <Badge variant="secondary">Sample catalogue</Badge>
                </div>
                <div className="review-controls pt-3">
                  <Select defaultValue="sample">
                    <SelectTrigger aria-label="Source" className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sample">Sample catalogue</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1 min-w-40">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      aria-label="Find a sample series"
                      className="pl-9"
                      placeholder="Search titles…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    aria-expanded={filters}
                    onClick={() => setFilters(!filters)}
                  >
                    <SlidersHorizontal />
                    Filters{adventure && ' (1)'}
                  </Button>
                </div>
              </CardHeader>
              <div className={filters ? 'review-library' : ''}>
                {filters && (
                  <aside className="p-panel border-r space-y-6">
                    <div>
                      <h3 className="font-medium mb-3">Genre</h3>
                      <label className="flex items-center gap-2">
                        <Checkbox
                          checked={adventure}
                          onCheckedChange={(value) => setAdventure(value === true)}
                        />
                        Adventure
                      </label>
                    </div>
                    <p className="text-caption text-muted-foreground">
                      Filters stay beside the results on wide windows.
                    </p>
                    {adventure && (
                      <Button variant="ghost" size="sm" onClick={() => setAdventure(false)}>
                        Clear filter
                      </Button>
                    )}
                  </aside>
                )}
                <div className="p-panel min-w-0">
                  <div className="flex justify-between items-center mb-5">
                    <p className="text-caption text-muted-foreground">
                      {visible.length} sample series
                    </p>
                    <p className="text-caption text-muted-foreground">Select a cover for details</p>
                  </div>
                  <div className="review-gallery">
                    {visible.map((book, index) => (
                      <article key={book.title} className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setSelected(book)}
                          className="block w-full text-left rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                          aria-label={`View ${book.title}`}
                        >
                          <div
                            className="review-cover"
                            style={{ '--mock-cover': `var(${book.color})` } as React.CSSProperties}
                          >
                            <small>Fictional edition {index + 1}</small>
                            <span className="review-cover-title">{book.title}</span>
                            <small>{book.author}</small>
                          </div>
                          <h3 className="font-medium mt-3 leading-snug">{book.title}</h3>
                        </button>
                        <p className="text-caption text-muted-foreground mt-1">{book.genre}</p>
                        {added.includes(book.title) && (
                          <Badge className="mt-2 gap-1" variant="success">
                            <Check size={12} />
                            In library
                          </Badge>
                        )}
                      </article>
                    ))}
                  </div>
                  {!visible.length && (
                    <div className="py-12 text-center">
                      <h3 className="text-section-title">No matching series</h3>
                      <p className="text-muted-foreground mt-2">
                        Try another title or clear the genre filter.
                      </p>
                      <Button
                        className="mt-4"
                        variant="outline"
                        onClick={() => {
                          setQuery('');
                          setAdventure(false);
                        }}
                      >
                        Clear search and filters
                      </Button>
                    </div>
                  )}
                  <p role="status" className="text-success mt-5 min-h-5">
                    {notice}
                  </p>
                </div>
              </div>
            </Card>
            <div className="review-grid-two review-section">
              <div>
                <h3 className="review-section-title">Artwork and information</h3>
                <p className="review-section-note">
                  Covers have a consistent footprint. Titles stay below the image. Library state is
                  visible without opening a menu.
                </p>
              </div>
              <div>
                <h3 className="review-section-title">One foundation, both themes</h3>
                <p className="review-section-note">
                  Switch the theme and density above. These are the same buttons, fields, badges,
                  and panels used by the desktop app.
                </p>
              </div>
            </div>
          </>
        )}
        {tab === 'Foundations' && (
          <>
            <section>
              <h2 className="review-section-title">Color by purpose</h2>
              <p className="review-section-note">
                Three surface levels separate the canvas, content, and temporary overlays. Blue
                identifies actions and selection.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {swatches.map((token) => (
                  <div key={token}>
                    <div className="review-swatch" style={{ background: `hsl(var(--${token}))` }} />
                    <p className="font-medium">{token}</p>
                    <code className="text-caption text-muted-foreground">--{token}</code>
                  </div>
                ))}
              </div>
            </section>
            <div className="review-grid-two review-section">
              <Card>
                <CardHeader>
                  <CardTitle>Type hierarchy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-page-title">Add series</p>
                  <p className="text-section-title">Recently updated</p>
                  <p className="text-body">Readable titles and controls at 14 px.</p>
                  <p className="text-caption text-muted-foreground">
                    Supporting details at 12 px. Inter, bundled locally.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Space and geometry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[4, 8, 12, 16, 24, 32].map((size) => (
                    <div className="flex items-center gap-4" key={size}>
                      <span className="text-caption w-10">{size} px</span>
                      <div className="bg-primary rounded-sm h-3" style={{ width: size * 4 }} />
                    </div>
                  ))}
                  <p className="text-caption text-muted-foreground">
                    6 px control corners, 10 px panels. 36 px controls, or 32 px in compact mode.
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
        {tab === 'Components' && (
          <div className="space-y-section">
            <section>
              <h2 className="review-section-title">Actions</h2>
              <div className="review-controls">
                <Button onClick={() => setSelected(books[0])}>Add to library</Button>
                <Button variant="outline">Filters</Button>
                <Button variant="secondary">Save changes</Button>
                <Button variant="ghost">Cancel</Button>
                <Button variant="destructive">Remove</Button>
                <Button disabled>Unavailable</Button>
                <Button variant="outline" size="icon" aria-label="Next">
                  <ChevronRight />
                </Button>
              </div>
              <p className="review-section-note mt-4">
                Use Tab to inspect keyboard focus. One primary action per section.
              </p>
            </section>
            <section>
              <h2 className="review-section-title">Fields and feedback</h2>
              <div className="review-grid-two">
                <div className="review-state">
                  <label htmlFor="example-title">Series title</label>
                  <Input id="example-title" placeholder="Enter a title" />
                  <span className="text-caption text-muted-foreground">
                    Labels stay visible when a field has a value.
                  </span>
                </div>
                <div className="review-state">
                  <label htmlFor="example-error">Source address</label>
                  <Input
                    id="example-error"
                    aria-invalid="true"
                    aria-describedby="address-error"
                    defaultValue="example"
                  />
                  <span id="address-error" className="text-caption text-danger">
                    Enter a complete website address.
                  </span>
                </div>
                <div className="review-state">
                  <label htmlFor="example-disabled">Unavailable field</label>
                  <Input
                    id="example-disabled"
                    disabled
                    placeholder="Not available for this source"
                  />
                </div>
                <div className="review-state">
                  <label id="example-sort-label">Sort order</label>
                  <Select defaultValue="recent">
                    <SelectTrigger aria-labelledby="example-sort-label">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recently updated</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
            <section>
              <h2 className="review-section-title">States have words as well as colors</h2>
              <div className="review-controls">
                <Badge variant="success">In library</Badge>
                <Badge variant="warning">Waiting for source</Badge>
                <Badge variant="danger">Connection failed</Badge>
                <Badge variant="secondary">Not started</Badge>
                <Badge variant="outline">Completed</Badge>
              </div>
            </section>
          </div>
        )}
        <Dialog
          open={selected !== null}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selected?.title}</DialogTitle>
              <DialogDescription>
                {selected?.author} / {selected?.genre}
              </DialogDescription>
            </DialogHeader>
            <p>{selected?.description}</p>
            <p className="text-caption text-muted-foreground">
              Fictional sample. Adding here only changes this preview.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button
                disabled={!!selected && added.includes(selected.title)}
                onClick={() => {
                  if (selected) {
                    setAdded([...added, selected.title]);
                    setNotice(`${selected.title} added to the sample library.`);
                    setSelected(null);
                  }
                }}
              >
                {selected && added.includes(selected.title)
                  ? 'Already in library'
                  : 'Add to library'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
