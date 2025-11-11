import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchService } from './match.service';
import { Match, MatchSchema } from '../schemas/match.schema';
import { MatchSnapshot, MatchSnapshotSchema } from '../schemas/match-snapshot.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Match.name, schema: MatchSchema },
            { name: MatchSnapshot.name, schema: MatchSnapshotSchema },
        ]),
    ],
    providers: [MatchService],
    exports: [MatchService],
})
export class MatchModule { }

