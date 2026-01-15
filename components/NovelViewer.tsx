interface NovelViewerProps {
  content: string;
}

export function NovelViewer({ content }: NovelViewerProps) {
  return (
    <div className="p-8 prose max-w-none">
      <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
        {content}
      </div>
    </div>
  );
}
