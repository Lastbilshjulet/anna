export const isYoutubeVideo = /^(https?:\/\/)?(www\.)?(m\.|music\.)?(youtube\.com|youtu\.?be)\/.+$/;
export const isYoutubePlaylsit = /^.*(list=)([^#\&\?]*).*/;
export const isSoundcloud = /^https?:\/\/(soundcloud\.com)\/(.*)$/;
export const isMobileSoundcloud = /^https?:\/\/(soundcloud\.app\.goo\.gl)\/(.*)$/;
export const isURL = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
export const isSpotifyURL = /^(https?:\/\/)?(www\.)?(open\.|play\.)?spotify\.com\/.+$/;
export const isSpotifyPlaylistURL = /^(https?:\/\/)?(www\.)?(open\.|play\.)?spotify\.com\/playlist\/.+$/;
