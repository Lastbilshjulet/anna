import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Song } from '../interfaces/song';

@Table({ timestamps: true, tableName: 'songs' })
class SongEntity extends Model<Song> {
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
}

export default SongEntity;
