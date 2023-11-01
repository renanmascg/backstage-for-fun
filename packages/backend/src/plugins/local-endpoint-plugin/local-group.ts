import axios from 'axios'
import { EntityProvider, EntityProviderConnection } from "@backstage/plugin-catalog-node";
import { ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, Entity } from '@backstage/catalog-model';
import { PluginEnvironment } from '../../types';

interface GroupDTO {
    id: number;
    title: string;
    email: string;
    description: string;
}

export class LocalGroupProvider implements EntityProvider {
    private baseUrl = 'http://localhost:3004'
    private connection?: EntityProviderConnection;

    constructor(private readonly env: PluginEnvironment) {}

    private buildGroupEntity(group: GroupDTO): Entity {
        return {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Group',
            metadata: {
                name: group.title,
                description: group.description,
                annotations: {
                    [ANNOTATION_LOCATION]: 'local-endpoint-provider:http://localhost:3004/groups',
                    [ANNOTATION_ORIGIN_LOCATION]: 'local-endpoint-provider:http://localhost:3004/groups',
                },
            },
            spec: {
                type: 'business-unit',
                profile: {
                    displayName: group.title,
                    email: group.email,
                },
                children: [],
                members: []
            }
        }
    }

    getProviderName(): string {
        return 'local-group-endpoint-provider'
    }

    async connect(connection: EntityProviderConnection): Promise<void> {
        this.connection = connection;
    }

    async run(): Promise<void> {
        if (!this.connection) {
            throw new Error('Not initialized');
        }

        const { data } = await axios.get<GroupDTO[]>(`${this.baseUrl}/groups`);

        const groupEntities: Entity[] = data.map(group => {
            return this.buildGroupEntity(group);
        })

        await this.connection.applyMutation({
            type: 'full',
            entities: groupEntities.map((groupEntity) => ({
                entity: groupEntity,
                locationKey: 'local-endpoint-provider:http://localhost:3004/group'
            }))
        })
    }
}