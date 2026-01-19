import { useState } from 'react';
import { useGetHoldings, useDeleteHolding } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import AddHoldingDialog from './AddHoldingDialog';
import EditHoldingDialog from './EditHoldingDialog';
import IncrementHoldingDialog from './IncrementHoldingDialog';
import { CryptoHolding } from '../backend';
import { toast } from 'sonner';
import { useCryptoPrices } from '../hooks/useCryptoPrices';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function HoldingsManager() {
  const { data: holdings = [], isLoading } = useGetHoldings();
  const deleteHolding = useDeleteHolding();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [incrementDialogOpen, setIncrementDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<CryptoHolding | null>(null);
  const { prices } = useCryptoPrices(holdings, []);

  const handleEdit = (holding: CryptoHolding) => {
    setSelectedHolding(holding);
    setEditDialogOpen(true);
  };

  const handleIncrement = (holding: CryptoHolding) => {
    setSelectedHolding(holding);
    setIncrementDialogOpen(true);
  };

  const handleDeleteClick = (holding: CryptoHolding) => {
    setSelectedHolding(holding);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedHolding) return;

    try {
      await deleteHolding.mutateAsync(selectedHolding.id);
      toast.success('Holding deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedHolding(null);
    } catch (error) {
      toast.error('Failed to delete holding');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading holdings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Crypto Holdings</CardTitle>
              <CardDescription>Manage your cryptocurrency portfolio</CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Holding
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {holdings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No holdings yet. Add your first cryptocurrency holding to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Amount Invested (£)</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">Gain/Loss</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((holding) => {
                    const currentPrice = prices?.[holding.symbol.toUpperCase()] || 0;
                    const currentValue = holding.amount * currentPrice;
                    const gainLoss = currentValue - holding.amountInvestedGBP;
                    const isPositive = gainLoss >= 0;

                    return (
                      <TableRow key={Number(holding.id)}>
                        <TableCell className="font-medium">{holding.symbol.toUpperCase()}</TableCell>
                        <TableCell className="text-right">{holding.amount.toFixed(8)}</TableCell>
                        <TableCell className="text-right">£{holding.amountInvestedGBP.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">
                          {currentPrice > 0 ? `£${currentPrice.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {currentPrice > 0 ? `£${currentValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </TableCell>
                        <TableCell className={`text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {currentPrice > 0 ? (
                            <>
                              {isPositive ? '+' : ''}£{gainLoss.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleIncrement(holding)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(holding)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(holding)}
                              disabled={deleteHolding.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddHoldingDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      {selectedHolding && (
        <>
          <EditHoldingDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            holding={selectedHolding}
          />
          <IncrementHoldingDialog
            open={incrementDialogOpen}
            onOpenChange={setIncrementDialogOpen}
            holding={selectedHolding}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holding</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this holding? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteHolding.isPending}>
              {deleteHolding.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
