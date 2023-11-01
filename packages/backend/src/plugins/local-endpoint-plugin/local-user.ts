import axios from 'axios'
import { EntityProvider, EntityProviderConnection } from "@backstage/plugin-catalog-node";
import { ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, Entity } from '@backstage/catalog-model';
import { PluginEnvironment } from '../../types';

interface UserDTO {
    id: number;
    name: string;
    email: string;
    picture: string;
    group: string;
}

export class LocalUserProvider implements EntityProvider {
    private baseUrl = 'http://localhost:3004'
    private connection?: EntityProviderConnection;

    constructor(private readonly env: PluginEnvironment) {}

    private buildUserEntity(user: UserDTO): Entity {
        return {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'User',
            metadata: {
                name: user.name,
                annotations: {
                    [ANNOTATION_LOCATION]: 'local-endpoint-provider:http://localhost:3004/users',
                    [ANNOTATION_ORIGIN_LOCATION]: 'local-endpoint-provider:http://localhost:3004/users',
                },
                title: user.name,
            },
            spec: {
                profile: {
                    displayName: user.name,
                    email: user.email,
                    picture: user.picture,
                },
                memberOf: [user.group]
            }
        }
    }

    getProviderName(): string {
        return 'local-usr-endpoint-provider'
    }

    async connect(connection: EntityProviderConnection): Promise<void> {
        this.connection = connection;
    }

    async run(): Promise<void> {
        if (!this.connection) {
            throw new Error('Not initialized');
        }

        const { data } = await axios.get<UserDTO[]>(`${this.baseUrl}/users`);

        console.log(data);

        const usrEntities: Entity[] = data.map(usr => {
            return this.buildUserEntity(usr);
        })

        // const groups = await axios.get(`${this.baseUrl}/groups`);

        await this.connection.applyMutation({
            type: 'full',
            entities: usrEntities.map((usrEntity) => ({
                entity: usrEntity,
                locationKey: 'local-endpoint-provider:http://localhost:3004/users'
            }))
        })
    }
}