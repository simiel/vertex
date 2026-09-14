import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {chunkTranscript, normalizeManifest, parseVideoUrl, VideoIngestionError} from './normalize.ts'
import {toNdjson} from './documents.ts'

const fixture = JSON.parse(await readFile(new URL('./fixture.json', import.meta.url), 'utf8'))
const videos = normalizeManifest(fixture)
assert.deepEqual(videos.map((video) => `${video.provider}:${video.id}`), ['bunny:video_123456', 'vimeo:12345678', 'youtube:9602Yzvd7ik'])
assert.equal(videos[2].canonicalUrl, 'https://www.youtube.com/watch?v=9602Yzvd7ik')
assert.equal(videos[2].chapters[0].label, 'File-system routing')
assert.equal(videos[2].chunks[0].text, 'Folders map to URL segments. Reserved files add framework behaviour.')
assert.match(toNdjson(videos), /"_type":"video"/)
assert.match(toNdjson(videos), /"_key":"chapter-0-0"/)
assert.equal(parseVideoUrl('https://player.vimeo.com/video/12345678', 'test').id, '12345678')
assert.deepEqual(chunkTranscript([
  {startSeconds: 0, text: 'before'},
  {startSeconds: 10, text: 'chapter starts here'},
], [{startSeconds: 10, label: 'Chapter'}]).map((chunk) => chunk.text), ['before', 'chapter starts here'])

assert.throws(() => normalizeManifest({videos: [{url: 'https://youtu.be/9602Yzvd7ik', transcript: [{startSeconds: -1, text: 'bad'}]}]}), VideoIngestionError)
assert.throws(() => normalizeManifest({videos: [fixture.videos[0], fixture.videos[0]]}), /duplicate video identity/)
assert.throws(() => normalizeManifest({videos: [{url: 'https://example.com/video', transcript: [{startSeconds: 0, text: 'bad'}]}]}), /provider is unsupported/)
console.log('video ingestion checks passed')
