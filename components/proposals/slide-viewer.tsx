'use client';

import { Card, CardContent } from '@/components/ui/card';

// ============================================
// TYPES
// ============================================

interface SlideContent {
  heading?: string;
  subheading?: string;
  bullets?: string[];
  body?: string;
  table?: {
    headers: string[];
    rows: string[][];
    footer?: string;
  };
  callout?: string;
}

interface Slide {
  slideNumber: number;
  type: string;
  title: string;
  content: SlideContent;
}

interface SlideViewerProps {
  slides: Slide[];
  currentSlide: number;
  onSlideChange: (index: number) => void;
}

// ============================================
// COMPONENTS
// ============================================

export function SlideViewer({ slides, currentSlide, onSlideChange }: SlideViewerProps) {
  const slide = slides[currentSlide];

  if (!slide) {
    return (
      <Card className="aspect-[16/9] flex items-center justify-center">
        <p className="text-gray-500">No slides to display</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main slide display */}
      <Card className="aspect-[16/9] overflow-hidden">
        <CardContent className="h-full p-8 flex flex-col">
          <SlideRenderer slide={slide} />
        </CardContent>
      </Card>

      {/* Slide navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onSlideChange(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => onSlideChange(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide
                  ? 'bg-blue-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => onSlideChange(Math.min(slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === slides.length - 1}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Slide counter */}
      <p className="text-center text-sm text-gray-500">
        Slide {currentSlide + 1} of {slides.length}
      </p>
    </div>
  );
}

// ============================================
// SLIDE RENDERER
// ============================================

function SlideRenderer({ slide }: { slide: Slide }) {
  const { type, title, content } = slide;

  return (
    <div className="h-full flex flex-col">
      {/* Title */}
      {type === 'title' ? (
        <TitleSlide title={title} content={content} />
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
          <div className="flex-1 overflow-auto">
            <SlideContent content={content} />
          </div>
        </>
      )}
    </div>
  );
}

function TitleSlide({ title, content }: { title: string; content: SlideContent }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        {content.heading || title}
      </h1>
      {content.subheading && (
        <p className="text-xl text-gray-600">{content.subheading}</p>
      )}
    </div>
  );
}

function SlideContent({ content }: { content: SlideContent }) {
  return (
    <div className="space-y-4">
      {content.heading && (
        <h3 className="text-lg font-semibold text-gray-800">{content.heading}</h3>
      )}

      {content.subheading && (
        <p className="text-gray-600">{content.subheading}</p>
      )}

      {content.body && <p className="text-gray-700">{content.body}</p>}

      {content.bullets && content.bullets.length > 0 && (
        <ul className="list-disc list-inside space-y-2">
          {content.bullets.map((bullet, index) => (
            <li key={index} className="text-gray-700">
              {bullet}
            </li>
          ))}
        </ul>
      )}

      {content.table && <SlideTable table={content.table} />}

      {content.callout && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-blue-800">{content.callout}</p>
        </div>
      )}
    </div>
  );
}

function SlideTable({
  table,
}: {
  table: { headers: string[]; rows: string[][]; footer?: string };
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {table.headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-2 text-sm text-gray-600 border">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.footer && (
        <p className="mt-2 text-sm text-gray-500 italic">{table.footer}</p>
      )}
    </div>
  );
}

// ============================================
// SLIDE THUMBNAILS
// ============================================

export function SlideThumbnails({
  slides,
  currentSlide,
  onSlideChange,
}: SlideViewerProps) {
  return (
    <div className="space-y-2">
      {slides.map((slide, index) => (
        <button
          key={index}
          onClick={() => onSlideChange(index)}
          className={`w-full p-2 text-left rounded border transition-colors ${
            index === currentSlide
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-5">{index + 1}</span>
            <span className="text-sm font-medium text-gray-700 truncate">
              {slide.title}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
