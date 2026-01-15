interface WebtoonViewerProps {
  imageUrls: string[];
}

export function WebtoonViewer({ imageUrls }: WebtoonViewerProps) {
  return (
    <div className="p-4">
      <div className="space-y-4">
        {imageUrls.map((url, index) => (
          <img
            key={index}
            src={url}
            alt={`웹툰 이미지 ${index + 1}`}
            className="w-full h-auto rounded-lg"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}
