import { useState, useEffect } from "react";
import { Sparkles, Trophy, Lock, TrendingUp, Gift, DollarSign } from "lucide-react";

interface Prize {
  id: string;
  name: string;
  description: string;
  cashValue: number | null;
  productName: string | null;
  imageUrl: string | null;
  unlockThreshold: number;
  unlockType: string;
  status?: string;
  unlockedAt?: string;
  winningNumber?: number;
  winnerName?: string;
  displayOrder: number;
}

interface BlessedNumbersData {
  raffle: {
    id: string;
    title: string;
    activityNumber: number;
    totalTickets: number;
    ticketsSold: number;
    salesPercentage: number;
  };
  revealedPrizes: Prize[];
  lockedPrizes: Prize[];
}

interface BlessedNumbersProps {
  raffleId: string;
}

export default function BlessedNumbers({ raffleId }: BlessedNumbersProps) {
  const [data, setData] = useState<BlessedNumbersData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlessedNumbers();
  }, [raffleId]);

  async function fetchBlessedNumbers() {
    try {
      const response = await fetch(`/api/raffles/${raffleId}/revealed-prizes`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching blessed numbers:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d4af37] mx-auto"></div>
      </div>
    );
  }

  if (!data || (data.revealedPrizes.length === 0 && data.lockedPrizes.length === 0)) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#d4af37] rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#d4af37] rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#d4af37]/10 px-6 py-2 rounded-full mb-4 border border-[#d4af37]/20">
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
            <span className="font-oswald font-bold text-[#d4af37] uppercase tracking-wider">
              Números Bendecidos
            </span>
          </div>
          <h2 className="font-oswald text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            ACTIVIDAD #{data.raffle.activityNumber}
          </h2>
          <p className="text-xl text-gray-700 font-raleway mb-8">
            {data.raffle.title}
          </p>

          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between text-sm font-raleway text-gray-600 mb-2">
              <span>Progreso de Ventas</span>
              <span className="text-[#d4af37] font-bold">
                {data.raffle.ticketsSold} / {data.raffle.totalTickets} boletos
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#d4af37] to-[#f0d98f] transition-all duration-1000 relative"
                style={{ width: `${Math.min(data.raffle.salesPercentage, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
            <div className="text-center mt-2">
              <span className="text-3xl font-oswald font-bold text-[#d4af37]">
                {data.raffle.salesPercentage.toFixed(1)}%
              </span>
              <span className="text-gray-600 font-raleway ml-2">completado</span>
            </div>
          </div>
        </div>

        {/* Revealed Prizes */}
        {data.revealedPrizes.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Trophy className="w-8 h-8 text-[#d4af37]" />
              <h3 className="font-oswald text-3xl font-bold text-gray-900">
                NÚMEROS GANADORES REVELADOS
              </h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.revealedPrizes.map((prize) => (
                <div
                  key={prize.id}
                  className="bg-white border-2 border-[#d4af37] rounded-xl p-6 transform hover:scale-105 transition-all duration-300 relative overflow-hidden shadow-lg"
                >
                  {/* Shimmer effect */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent animate-shimmer"></div>

                  {/* Prize Image */}
                  {prize.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={prize.imageUrl}
                        alt={prize.name}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}

                  {/* Prize Info */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#d4af37]/20 to-[#d4af37]/10 px-4 py-2 rounded-full mb-3 border border-[#d4af37]/30">
                      {prize.cashValue ? (
                        <>
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <span className="font-oswald text-2xl font-bold text-green-600">
                            ${prize.cashValue.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <>
                          <Gift className="w-5 h-5 text-[#d4af37]" />
                          <span className="font-oswald text-lg font-bold text-[#d4af37]">
                            {prize.productName}
                          </span>
                        </>
                      )}
                    </div>

                    <h4 className="font-oswald text-xl font-bold text-gray-900 mb-2">
                      {prize.name}
                    </h4>

                    {/* Winning Number */}
                    <div className="my-4 py-4 bg-gradient-to-br from-[#d4af37]/10 to-[#d4af37]/5 rounded-lg border-2 border-[#d4af37]">
                      <p className="text-sm text-gray-600 font-raleway mb-1">
                        Número Ganador
                      </p>
                      <p className="font-oswald text-5xl font-bold text-[#d4af37] tracking-wider">
                        #{prize.winningNumber?.toString().padStart(4, "0")}
                      </p>
                    </div>

                    {/* Winner Name */}
                    {prize.winnerName ? (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600 font-raleway mb-1">
                          🎉 Ganador
                        </p>
                        <p className="font-raleway text-lg font-bold text-gray-900">
                          {prize.winnerName}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-500 font-raleway italic">
                          ⏳ Esperando reclamación
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Prizes */}
        {data.lockedPrizes.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Lock className="w-8 h-8 text-gray-500" />
              <h3 className="font-oswald text-3xl font-bold text-gray-900">
                PRÓXIMOS PREMIOS A REVELAR
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {data.lockedPrizes.map((prize) => (
                <div
                  key={prize.id}
                  className="bg-white border-2 border-gray-300 rounded-xl p-6 relative overflow-hidden shadow-md"
                >
                  {/* Lock overlay */}
                  <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <Lock className="w-12 h-12 text-gray-400" />
                  </div>

                  {/* Prize Image (blurred) */}
                  {prize.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={prize.imageUrl}
                        alt={prize.name}
                        className="w-full h-32 object-cover blur-sm"
                      />
                    </div>
                  )}

                  {/* Prize Info */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-gray-200 px-3 py-1 rounded-full mb-2">
                      {prize.cashValue ? (
                        <span className="font-oswald text-sm font-bold text-gray-600">
                          ${prize.cashValue.toFixed(0)}
                        </span>
                      ) : (
                        <span className="font-oswald text-sm font-bold text-gray-600">
                          {prize.productName}
                        </span>
                      )}
                    </div>

                    <h4 className="font-oswald text-lg font-bold text-gray-700 mb-3">
                      {prize.name}
                    </h4>

                    {/* Unlock Threshold */}
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-raleway text-sm">
                        Se revela al {prize.unlockThreshold}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-xl text-gray-700 font-raleway mb-6">
            ¡Compra tus números ahora y participa por increíbles premios!
          </p>
          <a
            href="#packages"
            className="inline-block bg-[#d4af37] text-black px-12 py-4 rounded-lg font-oswald text-xl font-bold hover:bg-[#b8941f] transition-all transform hover:scale-105 shadow-lg"
          >
            COMPRAR NÚMEROS
          </a>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </section>
  );
}
