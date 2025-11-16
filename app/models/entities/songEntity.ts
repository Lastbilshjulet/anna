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

    @Column(DataType.STRING)
    declare requestedBy: string;

    @Column(DataType.INTEGER)
    declare duration: number;

    @Column(DataType.INTEGER)
    declare timesPlayed: number;

    public toString(): string {
        return `${this.ytId} | ${this.title} by ${this.artist} [${getDuration(this.duration)}], played ${this.timesPlayed} times.`;
    }
}

export default SongEntity;
