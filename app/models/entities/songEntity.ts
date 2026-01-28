import { Table, Column, Model, DataType, Unique } from 'sequelize-typescript';
import { Song } from '../interfaces/song';
import { getDuration } from '../../utils/embedReply';

@Table({ timestamps: true, tableName: 'songs' })
class SongEntity extends Model<Song> {
    @Unique
    @Column(DataType.STRING)
    declare ytId: string;

    @Column(DataType.STRING)
    declare title: string;

    @Column(DataType.STRING)
    declare artist: string;

    @Column(DataType.STRING)
    declare thumbnail: string;

    @Column(DataType.STRING)
    declare source: string;

    @Column(DataType.STRING)
    declare path: string;

    @Column({ type: DataType.STRING(10), allowNull: false, defaultValue: '.mp3' })
    declare extension: string;

    @Column(DataType.STRING)
    declare requestedBy: string;

    @Column(DataType.INTEGER)
    declare duration: number;

    @Column(DataType.INTEGER)
    declare timesPlayed: number;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
    declare autoplay: boolean;

    public toString(): string {
        const TIMES_WIDTH = 2;
        const AUTOPLAY_WIDTH = 5;
        const DURATION_WIDTH = 7;

        const yt = this.ytId ?? '';
        const duration = getDuration(this.duration ?? 0).padEnd(DURATION_WIDTH);
        const autoplayStr = (this.autoplay ? 'true' : 'false').padEnd(AUTOPLAY_WIDTH);
        const timesStr = String(this.timesPlayed ?? 0).padStart(TIMES_WIDTH);

        const titleArtist = `${this.artist ?? ''} - ${this.title ?? ''}`;

        return `${yt} | ${this.extension} autoplay: ${autoplayStr} | played: ${timesStr} | ${titleArtist}, ${duration}`;
    }
}

export default SongEntity;
