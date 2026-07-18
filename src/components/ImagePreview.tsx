interface ImagePreviewProps {
  imageUrl: string;
  onChangeImage: () => void;
}

export default function ImagePreview({ imageUrl, onChangeImage }: ImagePreviewProps) {
  return (
    <div className="flex min-h-[300px] flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">Original</h2>
        <button
          onClick={onChangeImage}
          className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
        >
          Change Image
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-zinc-950">
        <img
          src={imageUrl}
          alt="Uploaded"
          className="max-h-[60vh] w-full object-contain"
        />
      </div>
    </div>
  );
}
