export default function VideoPreview({ url }) {
  const yt = url && url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/);
  // Link reel/post Instagram: /reel/, /reels/, atau /p/ + kode (mis. AbCdEf123)
  const ig = url && url.match(/instagram\.com\/(?:reel[s]?|p)\/([\w-]+)/);
  const src = ig ? `https://www.instagram.com/reel/${ig[1]}/embed` : null;
  return (
    <div className="aspect-video overflow-hidden rounded-2xl bg-pandan-100">
      {!url ? (
        <div className="flex h-full items-center justify-center p-6 text-center text-pandan-700">Video preview kamar akan segera ditambahkan.</div>
      ) : yt ? (
        <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${yt[1]}`} title="Preview kamar" allowFullScreen />
      ) : src ? (
        <iframe className="h-full w-full" src={src} title="Preview kamar" allowFullScreen scrolling="no" />
      ) : (
        <video className="h-full w-full" src={url} controls playsInline />
      )}
    </div>
  );
}
