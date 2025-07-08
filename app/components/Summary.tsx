import { Card, List, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface SummaryProps {
    debtSummary: string[];
}

export default function Summary({ debtSummary }: SummaryProps) {
    return (
        <Card title="Summary">
            <List
                dataSource={debtSummary}
                renderItem={(item) => {
                    const [debtor, rest] = item.split(' owes ');
                    const [creditor, amount] = rest.split(' Rp ');
                    return (
                        <List.Item>
                            <Text>{debtor}</Text>
                            <ArrowRightOutlined style={{ margin: '0 10px' }} />
                            <Text>{creditor}</Text>
                            <Text strong style={{ marginLeft: 'auto' }}>Rp {amount}</Text>
                        </List.Item>
                    );
                }}
                locale={{ emptyText: "All settled up!" }}
            />
        </Card>
    );
}